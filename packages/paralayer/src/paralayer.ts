import '@eposlabs/utils/globals'

import * as $chokidar from 'chokidar'
import * as $fs from 'node:fs/promises'
import * as $path from 'node:path'
import * as $utils from '@eposlabs/utils'

import type { Plugin } from 'vite'

export type DirPath = string

export type File = {
  content: string
  names: string[]
}

export type Options = {
  input: DirPath | DirPath[]
  output: DirPath
  /** Default layer name. If a file name does not have layer tags, default name will be used. */
  default?: string | null
  /** Whether the layer variables should be exposed globally. */
  globalize?: boolean
}

export class Paralayer extends $utils.Unit {
  private files: { [path: string]: File | null } = {}
  private options: Options
  private started = false
  private ready = false
  private ready$ = Promise.withResolvers<void>()
  private queue = new $utils.Queue()
  private extensions = new Set(['.ts', '.tsx', '.js', '.jsx'])
  private previousLayers: string[] = []

  constructor(options: Options) {
    super()
    this.options = options
  }

  get vite(): Plugin {
    return {
      name: 'paralayer',
      enforce: 'pre',
      buildStart: this.onBuildStart,
    }
  }

  start = async () => {
    if (this.started) return
    this.started = true

    await $utils.safe($fs.rm(this.options.output, { recursive: true }))

    const watcher = $chokidar.watch(this.options.input)
    watcher.on('all', this.onAll)
    watcher.on('ready', this.onReady)

    await this.ready$.promise
    await this.queue.run(() => this.build())
  }

  private onBuildStart = async () => {
    await this.start()
  }

  private onAll = async (event: string, path: string) => {
    // Process only file events
    if (!['add', 'change', 'unlink'].includes(event)) return

    // Not supported file extension? -> Ignore
    const ext = $path.extname(path)
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
    const name = $path.basename(path)
    const layer = name.split('.').slice(1, -1).sort().join('.')
    if (layer) return layer
    return this.options.default ?? ''
  }

  private async build() {
    // Group file paths by layers
    const paths = Object.keys(this.files)
    if (paths.length === 0) return
    const pathsByLayers = Object.groupBy(paths, path => this.getLayer(path))
    const allLayers = Object.keys(pathsByLayers)

    // Ensure output directory exists
    await $fs.mkdir(this.options.output, { recursive: true })

    // Ensure all files are read
    await Promise.all(
      paths.map(async path => {
        if (this.files[path]) return
        const content = await $fs.readFile(path, 'utf-8')
        const names = this.extractExportedClassNames(content)
        this.files[path] = { content, names }
      }),
    )

    // Create layer files
    for (const layer in pathsByLayers) {
      // Generate layer.[layer].ts
      const layerFile = $path.join(this.options.output, `layer.${layer}.ts`)
      const layerPaths = pathsByLayers[layer]!.toSorted()
      const layerContent = this.generateLayerContent(layer, layerPaths)
      await $fs.writeFile(layerFile, layerContent, 'utf-8')

      // Top layer? -> Generate index.[layer].ts
      if (this.isTopLayer(layer)) {
        const indexFile = $path.join(this.options.output, `index.${layer}.ts`)
        const indexContent = this.generateIndexContent(layer, allLayers)
        await $fs.writeFile(indexFile, indexContent, 'utf-8')
      }
    }

    // Determine removed layers
    const removedLayers = this.previousLayers.filter(l => !allLayers.includes(l))
    this.previousLayers = allLayers

    // Delete files of removed layers
    for (const layer of removedLayers) {
      // Delete layer file
      const layerFile = $path.join(this.options.output, `layer.${layer}.ts`)
      await $fs.rm(layerFile)

      // Top layer? -> Remove index file
      if (this.isTopLayer(layer)) {
        const indexFile = $path.join(this.options.output, `index.${layer}.ts`)
        await $fs.rm(indexFile)
      }
    }

    // Generate setup.js file
    const setupFile = $path.join(this.options.output, 'setup.js')
    const setupContent = this.generateSetupContent(allLayers)
    await $fs.writeFile(setupFile, setupContent, 'utf-8')

    console.log(`[paralayer] Done`)
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
        const relativePath = $path.relative(this.options.output, path)
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
      .map(layer => `import './layer.${layer}.ts'`)

    return [...imports].join('\n')
  }

  private generateSetupContent(allLayers: string[]) {
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
    if (this.options.globalize) {
      globals = layers.map(layer => {
        const $layerName = this.getLayerName(layer, '$camel')
        return `globalThis.${$layerName} = ${$layerName}`
      })
      globals.unshift('')
    }

    return [nocheck, '', ...vars, ...globals, ''].join('\n')
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
