import type { Action, Mode, Spec } from 'epos-spec-parser'

export type Sources = Record<string, string>
export type Assets = Record<string, Blob>
export type BundleNoAssets = Omit<Bundle, 'assets'>

export type Bundle = {
  dev: boolean
  spec: Spec
  sources: Sources
  assets: Assets
}

export type Payload = {
  dev: boolean
  script: string
}

export type ActionMeta = {
  name: string
  title: Spec['title']
  action: Exclude<Action, null>
}

export type ExecutionMeta = {
  dev: boolean
  name: string
  title: Spec['title']
  popup: Spec['popup']
  hash: string
}

export class Project extends sw.Unit {
  declare name: string
  declare dev: boolean
  declare sources: Sources
  declare spec: Spec
  declare action: null | true | string
  declare targets: sw.ProjectTarget[]
  exporter = new sw.ProjectExporter(this)

  static async init(parent: sw.Unit, bundle: Bundle) {
    const i = new this(parent)
    await i.init(bundle)
    return i
  }

  private async init(bundle: Bundle) {
    await this.update(bundle)
  }

  static async restore(parent: sw.Unit, name: string) {
    const project = new Project(parent)
    const bundle = await project.$.idb.get<BundleNoAssets>(name, ':project', ':default')
    if (!bundle) return null
    await project.update(bundle)
    return project
  }

  async update(bundle: BundleNoAssets & { assets?: Assets }) {
    this.dev = bundle.dev
    this.name = bundle.spec.name
    this.spec = bundle.spec
    this.sources = bundle.sources
    this.action = this.prepareAction(bundle.spec.action)
    this.targets = bundle.spec.targets.map(target => new sw.ProjectTarget(this, target))

    if (bundle.assets) {
      await this.$.idb.deleteStore(this.name, ':assets')
      for (const [path, blob] of Object.entries(bundle.assets)) {
        await this.$.idb.set(this.name, ':assets', path, blob)
      }
    }

    await this.$.idb.set<BundleNoAssets>(this.name, ':project', ':default', {
      dev: this.dev,
      spec: this.spec,
      sources: this.sources,
    })
  }

  test(url: string, frame = false) {
    return this.targets.some(target => target.test(url, frame))
  }

  getCss(url: string, frame = false) {
    return this.getCode(url, frame, 'css', ['normal', 'lite'])
  }

  getLiteJs(url: string, frame = false) {
    return this.getCode(url, frame, 'js', ['lite'])
  }

  getPayload(url: string, frame = false): Payload | null {
    const js = this.getCode(url, frame, 'js', ['normal', 'shadow'])
    const shadowCss = this.getCode(url, frame, 'css', ['shadow'])
    if (!js && !shadowCss) return null

    // Layer variables are passed as arguments (undefineds) to isolate engine layers from project code
    const layers = [
      'cs',
      'ex',
      'gl',
      'os',
      'sm',
      'sw',
      'vw',
      'exOs',
      'exSw',
      'osVw',
      'swVw',
      'exOsVw',
      'exOsSwVw',
    ]

    return {
      dev: this.dev,
      script: [
        `{`,
        `  name: ${JSON.stringify(this.name)},`,
        `  icon: ${JSON.stringify(this.spec.icon)},`,
        `  title: ${JSON.stringify(this.spec.title)},`,
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
      title: this.spec.title,
      action: this.action,
    }
  }

  async getExecutionMeta(url: string, frame = false): Promise<ExecutionMeta | null> {
    if (!this.test(url, frame)) return null
    return {
      dev: this.dev,
      name: this.name,
      title: this.spec.title,
      popup: this.spec.popup,
      hash: await this.getExecutionHash(url, frame),
    }
  }

  private getCode(url: string, frame = false, lang: 'js' | 'css', modes: Mode[]) {
    const requiredSourcePaths = this.getRequiredSourcePaths(url, frame, { modes, lang })
    if (requiredSourcePaths.length === 0) return null
    return requiredSourcePaths.map(path => this.getSourceCode(path)).join('\n')
  }

  /** Used to determine if project must be reloaded. */
  async getExecutionHash(url: string, frame = false) {
    const requiredSourcePaths = this.getRequiredSourcePaths(url, frame).sort()
    return await this.$.utils.hash({
      dev: this.dev,
      assets: this.spec.assets,
      targets: this.targets.map(target => ({ mode: target.mode })),
      snippets: requiredSourcePaths.map(path => this.getSourceCode(path)),
    })
  }

  private getRequiredSourcePaths(
    url: string,
    frame = false,
    filter: { lang?: 'js' | 'css'; modes?: Mode[] } = {},
  ) {
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

  private getSourceCode(path: string) {
    if (path.endsWith('.js')) return `(async () => {\n${this.sources[path]}\n})();`
    if (path.endsWith('.css')) return this.sources[path]
    throw this.never
  }

  private prepareAction(action: Action) {
    if (!action) return null
    if (action === true) return true
    if (action.startsWith('<hub>')) return action.replace('<hub>', `${this.$.env.url.web}/@${this.name}`)
    return action
  }
}
