import { Queue, Unit, ensureArray, is, safe } from '@eposlabs/utils'
import { watch, type FSWatcher } from 'chokidar'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, extname, join, relative } from 'node:path'

export type DirPath = string
export type Input = DirPath | DirPath[]
export type Output = DirPath

export type File = {
  content: string
  names: string[]
}

export type Options = {
  input?: Input
  output?: Output
  watch?: boolean
  /** Whether the layer variables should be exposed globally. */
  expose?: boolean
  /** Layer that all other layers extend. */
  extend?: string | null
  /** Layer assigned to files without layer tags. */
  default?: string | null
}

export class Paralayer extends Unit {
  private files: { [path: string]: File | null } = {}
  private options: Omit<Options, 'input' | 'output'> & { input: Input; output: Output }
  private started = false
  private ready = false
  private ready$ = Promise.withResolvers<void>()
  private queue = new Queue()
  private extensions = new Set(['.ts', '.tsx', '.js', '.jsx'])
  private previousLayers: string[] = []
  private watcher: FSWatcher | null = null

  constructor(options: Options) {
    super()
    const inputs = ensureArray(options.input).filter(is.present)
    const input = inputs.length > 0 ? inputs : ['./src']
    const output = options.output ?? './src/layers'
    this.options = { ...options, input, output }
  }

  async start() {
    if (this.started) throw new Error('paralayer has already been started')
    this.started = true

    await safe(rm(this.options.output, { recursive: true }))

    this.watcher = watch(this.options.input)
    this.watcher.on('all', this.onAll)
    this.watcher.on('ready', this.onReady)

    await this.ready$.promise
    await this.queue.add(() => this.build())
    if (!this.options.watch) await this.watcher.close()

    // Return content of define.js
    const definePath = join(this.options.output, 'define.js')
    return await readFile(definePath, 'utf-8')
  }

  // MARK: Handlers
  // ============================================================================

  private onAll = async (event: string, path: string) => {
    // Process only file events
    if (!['add', 'change', 'unlink'].includes(event)) return

    // Not supported file extension? -> Ignore
    const ext = extname(path)
    if (!this.extensions.has(ext)) return

    // No layer in the file name? -> Ignore
    if (!this.getLayer(path)) return

    // Initial scan? -> Just register file
    if (!this.ready) {
      this.files[path] = null
      return
    }

    // File removed? -> Remove and rebuild
    if (event === 'unlink') {
      delete this.files[path]
      await this.queue.add(() => this.build())
    }

    // File added or changed? -> Reset its content and rebuild
    if (event === 'add' || event === 'change') {
      this.files[path] = null
      await this.queue.add(() => this.build())
    }
  }

  private onReady = async () => {
    this.ready = true
    this.ready$.resolve()
  }

  // MARK: Build
  // ============================================================================

  private async build() {
    const writeDefineJs = async (content: string) => {
      const definePath = join(this.options.output, 'define.js')
      await this.write(definePath, content)
    }

    // No files? -> Create empty define.js
    const paths = Object.keys(this.files)
    if (paths.length === 0) return await writeDefineJs('// No layers found\n')

    // Group file paths by layers
    const pathsByLayers = Object.groupBy(paths, path => this.getLayer(path))
    const allLayers = Object.keys(pathsByLayers)

    // Ensure output directory exists
    await mkdir(this.options.output, { recursive: true })

    // Ensure all files are read
    await Promise.all(
      paths.map(async path => {
        if (this.files[path]) return
        const content = await readFile(path, 'utf-8')
        const names = this.extractExportedClassNames(content)
        this.files[path] = { content, names }
      }),
    )

    // Create layer files
    for (const layer in pathsByLayers) {
      // Generate layer.[layer].ts
      const layerFile = join(this.options.output, `layer.${layer}.ts`)
      const layerPaths = pathsByLayers[layer]!.toSorted()
      const layerContent = this.generateLayerContent(layer, layerPaths)
      await this.write(layerFile, layerContent)

      // Top layer? -> Generate index.[layer].ts
      if (this.isTopLayer(layer)) {
        const indexFile = join(this.options.output, `index.${layer}.ts`)
        const indexContent = this.generateIndexContent(layer, allLayers)
        await this.write(indexFile, indexContent)
      }
    }

    // Determine removed layers
    const removedLayers = this.previousLayers.filter(l => !allLayers.includes(l))
    this.previousLayers = allLayers

    // Delete files of removed layers
    for (const layer of removedLayers) {
      // Delete layer file
      const layerFile = join(this.options.output, `layer.${layer}.ts`)
      await rm(layerFile)

      // Top layer? -> Remove index file
      if (this.isTopLayer(layer)) {
        const indexFile = join(this.options.output, `index.${layer}.ts`)
        await rm(indexFile)
      }
    }

    // Generate define.js file
    const defineContent = this.generateDefineContent(allLayers)
    await writeDefineJs(defineContent)
  }

  // MARK: Misc
  // ============================================================================

  private extractExportedClassNames(content: string) {
    if (content.includes('paralayer-ignore')) return []
    return content
      .split(/^export class /m)
      .slice(1)
      .map(part => part.split(' ')[0]?.split('<')[0])
      .filter(is.present)
  }

  private generateLayerContent(layer: string, layerPaths: string[]) {
    const layerName = this.getLayerName(layer, 'camel')
    const LayerName = this.getLayerName(layer, 'Pascal')
    const allNames = layerPaths.flatMap(path => this.files[path]?.names ?? [])

    const imports = layerPaths
      .map(path => {
        const file = this.files[path]
        if (!file) return ''
        if (file.names.length === 0) return ''
        const names = file.names
        const types = file.names.map(name => `type ${name} as ${name}Type`)
        const relativePath = relative(this.options.output, path)
        const relativePathAsJs = relativePath.replace(/(.ts|.tsx|.jsx)$/, '.js')
        return `import { ${[...names, ...types].join(', ')} } from '${relativePathAsJs}'`
      })
      .filter(Boolean)

    const assign = [`Object.assign(${layerName}, {`, ...allNames.map(name => `  ${name},`), `})`]

    let extendPascal = ''
    let extendCamel = ''
    if (this.options.extend && layer !== this.options.extend) {
      extendPascal = `extends ${this.getLayerName(this.options.extend, 'Pascal')} `
      extendCamel = `extends ${this.getLayerName(this.options.extend, 'camel')} `
    }

    const globals = [
      `declare global {`,
      `  const ${layerName}: ${LayerName}`,
      ``,
      `  interface ${LayerName} ${extendPascal}{`,
      ...allNames.map(name => `    ${name}: typeof ${name}`),
      `  }`,
      ``,
      `  interface ${layerName} ${extendCamel}{`,
      ...allNames.map(name => `    ${name}: ${name}`),
      `  }`,
      ``,
      `  namespace ${layerName} {`,
      ...allNames.map(name => `    export type ${name} = ${name}Type`),
      `  }`,
      `}`,
    ]

    return [...imports, '', ...assign, '', ...globals, ''].join('\n')
  }

  private generateIndexContent(topLayer: string, allLayers: string[]) {
    const imports = allLayers
      .filter(layer => layer.includes(topLayer))
      .sort((layer1, layer2) => {
        if (layer1.length !== layer2.length) return layer2.length - layer1.length
        return layer1.localeCompare(layer2)
      })
      .map(layer => `import './layer.${layer}.js'`)

    if (this.options.extend && topLayer !== this.options.extend) {
      imports.unshift(`import './layer.${this.options.extend}.js'`)
    }

    return [...imports, ''].join('\n')
  }

  private generateDefineContent(allLayers: string[]) {
    const layers = allLayers.toSorted((layer1, layer2) => {
      if (layer1.length !== layer2.length) return layer1.length - layer2.length
      return layer1.localeCompare(layer2)
    })

    const vars = layers.map(layer => {
      const layerName = this.getLayerName(layer, 'camel')
      if (this.options.expose) return `globalThis.${layerName} = {}`
      return `const ${layerName} = {}`
    })

    return [...vars, ''].join('\n')
  }

  private getLayer(path: string) {
    const name = basename(path)
    const layer = name.split('.').slice(1, -1).sort().join('.')
    if (layer) return layer
    return this.options.default ?? ''
  }

  private getLayerName(layer: string, style: 'camel' | 'Pascal') {
    const LayerName = layer.split('.').map(this.capitalize).join('')
    if (style === 'camel') return this.decapitalize(LayerName)
    if (style === 'Pascal') return LayerName
    throw this.never()
  }

  private capitalize(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  private decapitalize(string: string) {
    return string.charAt(0).toLowerCase() + string.slice(1)
  }

  private isTopLayer(layer: string) {
    return !layer.includes('.')
  }

  private async write(path: string, content: string) {
    const [prevContent] = await safe(() => readFile(path, 'utf-8'))
    if (content === prevContent) return
    await mkdir(join(path, '..'), { recursive: true })
    await writeFile(path, content, 'utf-8')
  }
}

// MARK: Export
// ============================================================================

export async function paralayer(options: Options) {
  const layers = await new Paralayer(options).start()
  return layers
}

export default paralayer
