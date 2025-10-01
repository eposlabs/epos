import { Queue, safe, Unit } from '@eposlabs/utils'
import type { FSWatcher } from 'chokidar'
import { watch } from 'chokidar'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, extname, join, relative } from 'node:path'

export type DirPath = string

export type File = {
  content: string
  names: string[]
}

export type Options = {
  input: DirPath | DirPath[]
  output: DirPath
  watch?: boolean
  /** Whether the layer variables should be exposed globally. */
  globalize?: boolean
  /** If a file name does not have layer tags, default layer name will be used. */
  defaultLayerName?: string | null
}

export class Paralayer extends Unit {
  private files: { [path: string]: File | null } = {}
  private options: Options
  private started = false
  private ready = false
  private ready$ = Promise.withResolvers<void>()
  private queue = new Queue()
  private extensions = new Set(['.ts', '.tsx', '.js', '.jsx'])
  private previousLayers: string[] = []
  private watcher: FSWatcher | null = null

  constructor(options: Options) {
    super()
    this.options = options
  }

  async start() {
    if (this.started) return
    this.started = true

    await safe(rm(this.options.output, { recursive: true }))

    this.watcher = watch(this.options.input)
    this.watcher.on('all', this.onAll)
    this.watcher.on('ready', this.onReady)

    await this.ready$.promise
    await this.queue.run(() => this.build())
    if (!this.options.watch) await this.watcher.close()
  }

  async readSetupJs() {
    const setupJsPath = join(this.options.output, 'setup.js')
    return await readFile(setupJsPath, 'utf-8')
  }

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

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
      await this.queue.run(() => this.build())
    }

    // File added/changed? -> Reset its content and rebuild
    if (event === 'add' || event === 'change') {
      this.files[path] = null
      await this.queue.run(() => this.build())
    }
  }

  private onReady = async () => {
    this.ready = true
    this.ready$.resolve()
  }

  // ---------------------------------------------------------------------------
  // BUILD
  // ---------------------------------------------------------------------------

  private async build() {
    // Group file paths by layers
    const paths = Object.keys(this.files)
    if (paths.length === 0) return
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

    // Generate setup.js file
    const setupFile = join(this.options.output, 'setup.js')
    const setupContent = this.generateSetupContent(allLayers)
    await this.write(setupFile, setupContent)
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private extractExportedClassNames(content: string) {
    if (content.includes('paralayer-ignore')) return []
    return content
      .split('export class ')
      .slice(1)
      .map(part => part.split(' ')[0].split('<')[0])
  }

  private generateLayerContent(layer: string, layerPaths: string[]) {
    const $LayerName = this.getLayerName(layer, '$Pascal')
    const $layerName = this.getLayerName(layer, '$camel')
    const allNames = layerPaths.flatMap(path => this.files[path]?.names ?? [])

    const imports = layerPaths
      .map(path => {
        const file = this.files[path]
        if (!file) return ''
        if (file.names.length === 0) return ''
        const names = file.names
        const types = file.names.map(name => `type ${name} as ${name}Type`)
        const relativePath = relative(this.options.output, path)
        return `import { ${[...names, ...types].join(', ')} } from '${relativePath}'`
      })
      .filter(Boolean)

    const assign = [`Object.assign(${$layerName}, {`, ...allNames.map(name => `  ${name},`), `})`]

    const globals = [
      `declare global {`,
      `  var ${$layerName}: ${$LayerName}`,
      ``,
      `  interface ${$LayerName} {`,
      ...allNames.map(name => `    ${name}: typeof ${name}`),
      `  }`,
      ``,
      `  namespace ${$layerName} {`,
      ...allNames.map(name => `    export type ${name} = ${name}Type`),
      `  }`,
      `}`,
    ]

    return ['// @ts-ignore', '', ...imports, '', ...assign, '', ...globals, ''].join('\n')
  }

  private generateIndexContent(topLayer: string, allLayers: string[]) {
    const imports = allLayers
      .filter(layer => layer.includes(topLayer))
      .sort((layer1, layer2) => {
        if (layer1.length !== layer2.length) return layer2.length - layer1.length
        return layer1.localeCompare(layer2)
      })
      .map(layer => `import './layer.${layer}.ts'`)

    return [...imports].join('\n')
  }

  private generateSetupContent(allLayers: string[]) {
    const layers = allLayers.toSorted((layer1, layer2) => {
      if (layer1.length !== layer2.length) return layer1.length - layer2.length
      return layer1.localeCompare(layer2)
    })

    const vars = layers.map(layer => {
      const $layerName = this.getLayerName(layer, '$camel')
      if (this.options.globalize) return `globalThis.${$layerName} = {}`
      return `const ${$layerName} = {}`
    })

    return [...vars].join('\n')
  }

  private getLayer(path: string) {
    const name = basename(path)
    const layer = name.split('.').slice(1, -1).sort().join('.')
    if (layer) return layer
    return this.options.defaultLayerName ?? ''
  }

  private getLayerName(layer: string, style: '$camel' | '$Pascal') {
    const LayerName = layer.split('.').map(this.capitalize).join('')
    if (style === '$camel') return `$${this.decapitalize(LayerName)}`
    if (style === '$Pascal') return `$${LayerName}`
    throw this.never
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
    await writeFile(path, content, 'utf-8')
  }
}

export async function paralayer(options: Options) {
  const pl = new Paralayer(options)
  await pl.start()
  return await pl.readSetupJs()
}

export default paralayer
