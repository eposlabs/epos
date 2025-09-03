import type { Action, Manifest, Mode, Popup } from '../pkgs-parser.sw'

export type Sources = Record<string, string>
export type Assets = Record<string, Blob>
export type SourceFilter = { modes?: Mode[]; lang?: 'js' | 'css' }

export type Data = {
  name: string
  sources: Sources
  manifest: Manifest
  dev: boolean
}

export type Fragment = {
  name: string
  hash: string
  popup: Popup
}

// TODO: update hash deps (assets, mode, smth else?)
export class Pkg extends $sw.Unit {
  declare name: string
  declare dev: boolean
  declare sources: Sources
  declare manifest: Manifest
  declare action: null | true | string
  declare targets: $sw.PkgTarget[]
  exporter = new $sw.PkgExporter(this)

  static async create(parent: $sw.Unit, data: Data, assets?: Assets) {
    const pkg = new Pkg(parent)
    await pkg.update(data, assets)
    return pkg
  }

  static async restore(parent: $sw.Unit, name: string) {
    const pkg = new Pkg(parent)
    const data = await pkg.$.idb.get<Data>(name, ':pkg', ':default')
    if (!data) return null
    pkg.update(data)
    return pkg
  }

  async update(data: Data, assets?: Assets) {
    this.name = data.name
    this.dev = data.dev
    this.sources = data.sources
    this.manifest = data.manifest
    this.action = this.prepareAction(data.manifest.action)
    this.targets = data.manifest.targets.map(target => new $sw.PkgTarget(this, target))

    if (assets) {
      await this.$.idb.deleteStore(this.name, ':assets')
      for (const [path, blob] of Object.entries(assets)) {
        await this.$.idb.set(this.name, ':assets', path, blob)
      }
    }

    await this.$.idb.set<Data>(this.name, ':pkg', ':default', {
      name: this.name,
      sources: this.sources,
      manifest: this.manifest,
      dev: this.dev,
    })
  }

  test(uri: string) {
    return this.targets.some(target => target.test(uri))
  }

  getDef(uri: string) {
    const js = this.getCode(uri, { modes: ['normal', 'shadow'], lang: 'js' })
    const shadowCss = this.getCode(uri, { modes: ['shadow'], lang: 'css' })
    if (!js && !shadowCss) return null

    // Layer variables are passed as arguments (undefineds) to isolate engine layers from pkg code
    const layers = [
      ...['$gl', '$cs', '$ex', '$os', '$sm', '$sw', '$vw'],
      ...['$exOs', '$exSw', '$osVw', '$swVw'],
      ...['$exOsVw', '$exOsSwVw'],
    ]

    return [
      `{`,
      `  name: ${JSON.stringify(this.name)},`,
      `  icon: ${JSON.stringify(this.manifest.icon)},`,
      `  title: ${JSON.stringify(this.manifest.title)},`,
      `  shadowCss: ${JSON.stringify(shadowCss)},`,
      `  fn(epos, React = epos.react, ${layers.join(', ')}) { ${js} },`,
      `}`,
    ].join('\n')
  }

  getCss(uri: string) {
    return this.getCode(uri, { modes: ['normal', 'lite'], lang: 'css' })
  }

  getLiteJs(uri: string) {
    return this.getCode(uri, { modes: ['lite'], lang: 'js' })
  }

  async getFragment(uri: string): Promise<Fragment | null> {
    if (!this.test(uri)) return null
    return {
      name: this.name,
      hash: await this.calcHash(uri),
      popup: this.manifest.popup,
    }
  }

  private getCode(uri: string, filter: SourceFilter) {
    const sourcePaths = this.getSourcePaths(uri, filter)
    if (sourcePaths.length === 0) return null
    return sourcePaths.map(path => this.getSource(path)).join('\n')
  }

  private async calcHash(uri: string) {
    const paths = this.getSourcePaths(uri).sort()
    const snippets = paths.map(path => this.getSource(path))
    return await this.$.utils.hash([...snippets, this.manifest.popup])
  }

  private getSourcePaths(uri: string, filter: SourceFilter = {}) {
    return (
      this.targets
        // Filter targets by URI
        .filter(target => target.test(uri))
        // Filter targets by mode
        .filter(target => !filter.modes || filter.modes.includes(target.mode))
        // Extract source paths
        .flatMap(target => target.load)
        // Remove duplicates
        .filter(this.$.utils.unique.filter)
        // Filter source paths by language
        .filter(path => !filter.lang || path.endsWith(`.${filter.lang}`))
    )
  }

  private getSource(path: string) {
    if (path.endsWith('.js')) return `(async () => {\n${this.sources[path]}\n})();`
    if (path.endsWith('.css')) return this.sources[path]
    throw this.never
  }

  private prepareAction(action: Action) {
    if (action === null) return null
    if (action === true) return true
    if (!action.startsWith('<hub>')) return action
    return action.replace('<hub>', `${this.$.env.url.web}/@${this.name}`)
  }
}
