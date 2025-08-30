import type { Manifest, Mode, Pattern, Popup } from '../../pkgs-parser.sw'
import type { Target } from './pkg-target.sw'

export type Data = { name: string; dev: boolean; sources: Sources; manifest: Manifest }
export type Fragment = { name: string; hash: string; popup: Popup }
export type Sources = Record<string, string>
export type Assets = Record<string, Blob>

// TODO: update hash deps (assets, mode, smth else?)
export class Pkg extends $sw.Unit {
  private exporter = new $sw.PkgExporter(this)
  declare name: string
  declare targets: $sw.PkgTarget[]
  declare sources: Sources
  declare manifest: Manifest
  declare dev: boolean
  export = this.$.utils.link(this.exporter, 'export')

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
    this.targets = data.manifest.targets.map(target => new $sw.PkgTarget(this, target))

    if (assets) {
      await this.$.idb.deleteStore(this.name, ':assets')
      for (const [path, blob] of Object.entries(assets)) {
        await this.$.idb.set(this.name, ':assets', path, blob)
      }
    }

    await this.$.idb.set<Data>(this.name, ':pkg', ':default', {
      name: this.name,
      dev: this.dev,
      sources: this.sources,
      manifest: this.manifest,
    })
  }

  matches(pattern: Pattern) {
    return this.targets.some(target => target.matches(pattern))
  }

  getDefJs(pattern: Pattern) {
    const js = this.getCode(pattern, ['normal', 'shadow'], 'js')
    if (!js) return ''
    const shadowCss = this.getCode(pattern, ['shadow'], 'css')
    const layers = [
      ...['$gl', '$cs', '$ex', '$os', '$sw', '$vw'],
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
    ].join('')
  }

  getCss(target: Target) {
    return this.getCode(target, ['normal', 'lite'], 'css')
  }

  getLiteJs(target: Target) {
    return this.getCode(target, ['lite'], 'js')
  }

  async getFragment(target: Target): Promise<Fragment | null> {
    if (!this.matches(target)) return null
    return {
      name: this.name,
      hash: await this.getHash(target),
      popup: this.manifest.popup,
    }
  }

  private getCode(target: Target, modes: Mode[], lang: 'js' | 'css') {
    return this.getSources(target, modes, lang)
      .map(source => this.read(source))
      .join('\n')
  }

  private async getHash(target: Target) {
    const sources = this.getSources(target).sort()
    const snippets = sources.map(source => this.read(source))
    return await this.$.utils.hash([...snippets, this.manifest.popup])
  }

  private getSources(target: Target, modes?: Mode[], lang?: 'js' | 'css') {
    return this.bundles
      .filter(b => (!modes || modes.includes(b.mode)) && b.matches(target))
      .flatMap(bundle => bundle.src)
      .filter(this.$.utils.unique.filter)
      .filter(path => (lang ? path.endsWith(`.${lang}`) : true))
  }

  private read(path: string) {
    if (path.endsWith('.js')) return `(async () => {\n${this.src[path]}\n})();`
    if (path.endsWith('.css')) return this.src[path]
    throw this.never
  }
}
