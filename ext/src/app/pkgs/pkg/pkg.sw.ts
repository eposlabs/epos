import type { Action, Manifest, Mode } from 'epos-manifest-parser'

export type Sources = Record<string, string>
export type Assets = Record<string, Blob>
export type SourceFilter = { modes?: Mode[]; lang?: 'js' | 'css' }

export type Spec = {
  dev: boolean
  // TODO: why name if manifest.name is the same?
  name: string
  sources: Sources
  manifest: Manifest
}

export type Payload = {
  dev: boolean
  script: string
}

export type ActionMeta = {
  name: string
  title: Manifest['title']
  action: Exclude<Action, null>
}

export type ExecutionMeta = {
  dev: boolean
  name: string
  title: Manifest['title']
  popup: Manifest['popup']
  hash: string
}

export class Pkg extends $sw.Unit {
  declare name: string
  declare dev: boolean
  declare sources: Sources
  declare manifest: Manifest
  declare action: null | true | string
  declare targets: $sw.PkgTarget[]
  exporter = new $sw.PkgExporter(this)

  static async create(parent: $sw.Unit, spec: Spec, assets?: Assets) {
    const pkg = new Pkg(parent)
    await pkg.update(spec, assets)
    return pkg
  }

  static async restore(parent: $sw.Unit, name: string) {
    const pkg = new Pkg(parent)
    const spec = await pkg.$.idb.get<Spec>(name, ':pkg', ':default')
    if (!spec) return null
    await pkg.update(spec)
    return pkg
  }

  async update(spec: Spec, assets?: Assets) {
    this.name = spec.name
    this.dev = spec.dev
    this.sources = spec.sources
    this.manifest = spec.manifest
    this.action = this.prepareAction(spec.manifest.action)
    this.targets = spec.manifest.targets.map(target => new $sw.PkgTarget(this, target))

    if (assets) {
      await this.$.idb.deleteStore(this.name, ':assets')
      for (const [path, blob] of Object.entries(assets)) {
        await this.$.idb.set(this.name, ':assets', path, blob)
      }
    }

    await this.$.idb.set<Spec>(this.name, ':pkg', ':default', {
      name: this.name,
      sources: this.sources,
      manifest: this.manifest,
      dev: this.dev,
    })
  }

  test(url: string, frame = false) {
    return this.targets.some(target => target.test(url, frame))
  }

  getCss(url: string, frame = false) {
    return this.getCode(url, frame, { modes: ['normal', 'lite'], lang: 'css' })
  }

  getLiteJs(url: string, frame = false) {
    return this.getCode(url, frame, { modes: ['lite'], lang: 'js' })
  }

  getPayload(url: string, frame = false): Payload | null {
    const js = this.getCode(url, frame, { modes: ['normal', 'shadow'], lang: 'js' })
    const shadowCss = this.getCode(url, frame, { modes: ['shadow'], lang: 'css' })
    if (!js && !shadowCss) return null

    // Layer variables are passed as arguments (undefineds) to isolate engine layers from pkg code
    const layers = [
      ...['$gl', '$cs', '$ex', '$os', '$sm', '$sw', '$vw'],
      ...['$exOs', '$exSw', '$osVw', '$swVw'],
      ...['$exOsVw', '$exOsSwVw'],
    ]

    return {
      dev: this.dev,
      script: [
        `{`,
        `  name: ${JSON.stringify(this.name)},`,
        `  icon: ${JSON.stringify(this.manifest.icon)},`,
        `  title: ${JSON.stringify(this.manifest.title)},`,
        `  shadowCss: ${JSON.stringify(shadowCss)},`,
        `  async fn(epos, React = epos.libs.react, ${layers.join(', ')}) { ${js} },`,
        `}`,
      ].join('\n'),
    }
  }

  getActionMeta(): ActionMeta | null {
    if (!this.action) return null
    return {
      name: this.name,
      title: this.manifest.title,
      action: this.action,
    }
  }

  async getExecutionMeta(url: string, frame = false): Promise<ExecutionMeta | null> {
    if (!this.test(url, frame)) return null
    return {
      dev: this.dev,
      name: this.name,
      title: this.manifest.title,
      popup: this.manifest.popup,
      hash: await this.getExecutionHash(url, frame),
    }
  }

  private getCode(url: string, frame = false, filter: SourceFilter = {}) {
    const sourcePaths = this.getSourcePaths(url, frame, filter)
    if (sourcePaths.length === 0) return null
    return sourcePaths.map(path => this.getSource(path)).join('\n')
  }

  /** Used to determine if package must be reloaded. */
  async getExecutionHash(url: string, frame = false) {
    const usedSourcePaths = this.getSourcePaths(url, frame).sort()
    return await this.$.utils.hash({
      dev: this.dev,
      assets: this.manifest.assets,
      targets: this.targets.map(target => ({ mode: target.mode })),
      snippets: usedSourcePaths.map(path => this.getSource(path)),
    })
  }

  private getSourcePaths(url: string, frame = false, filter: SourceFilter = {}) {
    return (
      this.targets
        // Filter targets by URI
        .filter(target => target.test(url, frame))
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
