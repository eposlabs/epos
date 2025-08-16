import { Unit } from '@/unit'
import { Queue, safe } from '@/utils'

import type { Project } from './project'

export type File = {
  content: string
  names: string[]
}

export class ProjectLayers extends Unit<Project> {
  private cmds = ['dev', 'preview', 'build', 'tsx', 'tsc']

  private files: { [path: string]: File | null } = {}
  private ready = false
  private ready$ = Promise.withResolvers<void>()
  private queue = new Queue()
  private extensions = new Set(['.ts', '.tsx'])
  private previousLayers: string[] = []

  private get outdir() {
    if (!this.$.config.layers) throw this.never
    return this.$.config.layers.output
  }

  private get globalize() {
    const config = this.$.config.layers
    if (config && 'globalize' in config) return config.globalize
    return false
  }

  async start() {
    if (!this.$.config.layers) return
    if (!this.cmds.includes(this.$.cmd.name)) return

    await safe(() => this.$.libs.fs.rm(this.outdir, { recursive: true }))
    await this.$.libs.fs.mkdir(this.outdir, { recursive: true })
    const watcher = this.$.libs.chokidar.watch(this.$.config.layers.input)
    watcher.on('all', this.onAll)
    watcher.on('ready', this.onReady)
    await this.ready$.promise
    await this.queue.run(() => this.build())
  }

  private onAll = async (event: string, path: string) => {
    // Process only file events
    if (!['add', 'change', 'unlink'].includes(event)) return

    // Not supported file extension? -> Ignore
    const ext = this.$.libs.path.extname(path)
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

  private getLayer(path: string) {
    const name = this.$.libs.path.basename(path)
    const layer = name.split('.').slice(1, -1).sort().join('.')
    if (layer) return layer
    return this.$.config.layers?.default ?? ''
  }

  private async build() {
    // Ensure output directory exists
    await this.$.libs.fs.mkdir(this.outdir, { recursive: true })

    // Group file paths by layers
    const paths = Object.keys(this.files)
    const pathsByLayers = Object.groupBy(paths, path => this.getLayer(path))
    const allLayers = Object.keys(pathsByLayers)

    // Ensure all files are read
    await Promise.all(
      paths.map(async path => {
        if (this.files[path]) return
        const content = await this.$.libs.fs.readFile(path, 'utf-8')
        const names = this.extractExportedClassNames(content)
        this.files[path] = { content, names }
      }),
    )

    // Create layer files
    for (const layer in pathsByLayers) {
      // Generate layer.[layer].ts
      const layerFile = this.$.libs.path.join(this.outdir, `layer.${layer}.ts`)
      const layerPaths = pathsByLayers[layer]!.toSorted()
      const layerContent = this.generateLayerContent(layer, layerPaths)
      await this.$.libs.fs.writeFile(layerFile, layerContent, 'utf-8')

      // Top layer? -> Generate index.[layer].ts
      if (this.isTopLayer(layer)) {
        const indexFile = this.$.libs.path.join(this.outdir, `index.${layer}.ts`)
        const indexContent = this.generateIndexContent(layer, allLayers)
        await this.$.libs.fs.writeFile(indexFile, indexContent, 'utf-8')
      }
    }

    // Determine removed layers
    const removedLayers = this.previousLayers.filter(l => !allLayers.includes(l))
    this.previousLayers = allLayers

    // Delete files of removed layers
    for (const layer of removedLayers) {
      // Delete layer file
      const layerFile = this.$.libs.path.join(this.outdir, `layer.${layer}.ts`)
      await this.$.libs.fs.rm(layerFile)

      // Top layer? -> Remove index file
      if (this.isTopLayer(layer)) {
        const indexFile = this.$.libs.path.join(this.outdir, `index.${layer}.ts`)
        await this.$.libs.fs.rm(indexFile)
      }
    }

    // Generate define.js file
    const defineFile = this.$.libs.path.join(this.outdir, 'define.js')
    const defineContent = this.generateDefineContent(allLayers)
    await this.$.libs.fs.writeFile(defineFile, defineContent, 'utf-8')
  }

  private extractExportedClassNames(content: string) {
    return content
      .split('export class ')
      .slice(1)
      .map(part => part.split(' ')[0].split('<')[0])
  }

  private generateLayerContent(layer: string, layerPaths: string[]) {
    const LayerName = this.getLayerName(layer, 'Pascal')
    const $LayerName = this.getLayerName(layer, '$Pascal')
    const $layerName = this.getLayerName(layer, '$camel')
    const allNames = layerPaths.flatMap(path => this.files[path]!.names)

    const imports = layerPaths
      .map(path => {
        const file = this.files[path]
        if (!file) throw this.never
        if (file.names.length === 0) return ''
        const names = file.names
        const types = file.names.map(name => `type ${name} as ${name}Type`)
        const noExtPath = path.split('.').slice(0, -1).join('.')
        const relativePath = this.$.libs.path.relative(this.outdir, noExtPath)
        return `import { ${[...names, ...types].join(', ')} } from '${relativePath}'`
      })
      .filter(Boolean)

    const assign = [
      `Object.assign(${$layerName}, {`,
      ...allNames.map(name => `  ${name},`),
      `})`,
    ]

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

    return [...imports, '', ...assign, '', ...globals, ''].join('\n')
  }

  private generateIndexContent(topLayer: string, allLayers: string[]) {
    const imports = allLayers
      .filter(layer => layer.includes(topLayer))
      .sort((layer1, layer2) => {
        if (layer1.length !== layer2.length) return layer2.length - layer1.length
        return layer1.localeCompare(layer2)
      })
      .map(layer => `import './layer.${layer}'\n`)

    return [...imports].join('\n')
  }

  private generateDefineContent(allLayers: string[]) {
    const nocheck = '// @ts-nocheck'

    const layers = allLayers.toSorted((layer1, layer2) => {
      if (layer1.length !== layer2.length) return layer1.length - layer2.length
      return layer1.localeCompare(layer2)
    })

    const vars = layers.map(layer => {
      const $layerName = this.getLayerName(layer, '$camel')
      return `const ${$layerName} = {}`
    })

    let globals: string[] = []
    if (this.globalize) {
      globals = layers.map(layer => {
        const $layerName = this.getLayerName(layer, '$camel')
        return `globalThis.${$layerName} = ${$layerName}`
      })
    }

    return [nocheck, '', ...vars, '', ...globals, ''].join('\n')
  }

  private getLayerName(layer: string, style: 'Pascal' | '$Pascal' | '$camel') {
    const LayerName = layer.split('.').map(this.capitalize).join('')
    if (style === 'Pascal') return LayerName
    if (style === '$Pascal') return `$${LayerName}`
    if (style === '$camel') return `$${this.decapitalize(LayerName)}`
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
}
