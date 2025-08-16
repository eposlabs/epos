import type { Manifest, Mode, Popup } from 'epos-types'
import type { Target } from './pkg-bundle.sw'

export type Src = { [path: string]: string }
export type Assets = { [path: string]: Blob }
export type Fragment = { name: string; hash: string; popup: Popup }

export type PkgData = {
  name: string
  dev: boolean
  src: Src
  manifest: Manifest
  assets?: Assets
}

// TODO: does pkg hash require assets?
// YEs, asset hash is required as well
// probably for now, don't bother, just use source hash
export class Pkg extends $sw.Unit {
  private exporter = new $sw.PkgExporter(this)
  declare name: string
  declare bundles: $sw.PkgBundle[]
  declare dev: boolean
  declare src: Src
  declare manifest: Manifest
  export = this.$.bind(this.exporter, 'export')

  /** Creates new pkg from data. */
  static async create(parent: $sw.Unit, data: PkgData) {
    const pkg = new Pkg(parent)
    await pkg.applyData(data)
    return pkg
  }

  /** Restores pkg from IDB. */
  static async restore(parent: $sw.Unit, name: string) {
    const pkg = new Pkg(parent)
    const data = await pkg.$.idb.get<PkgData>(name, ':pkg', ':default')
    if (!data) return null
    pkg.applyData(data)
    return pkg
  }

  async applyData(data: PkgData) {
    this.name = data.name
    this.dev = data.dev
    this.src = data.src
    this.manifest = data.manifest
    this.bundles = data.manifest.bundles.map(bundle => new $sw.PkgBundle(this, bundle))

    if (data.assets) {
      await this.$.idb.deleteStore(this.name, ':assets')
      for (const [path, blob] of Object.entries(data.assets)) {
        await this.$.idb.set(this.name, ':assets', path, blob)
      }
    }

    await this.$.idb.set<PkgData>(this.name, ':pkg', ':default', {
      name: this.name,
      dev: this.dev,
      src: this.src,
      manifest: this.manifest,
    })
  }

  matches(target: Target) {
    return this.bundles.some(bundle => bundle.matches(target))
  }

  getDefJs(target: Target) {
    const js = this.getCode(target, ['normal', 'shadow'], 'js')
    if (!js) return ''
    const shadowCss = this.getCode(target, ['shadow'], 'css')
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
    // TODO: trigger on 'mode' change
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
