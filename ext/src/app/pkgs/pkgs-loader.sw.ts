import type { BundleNoAssets } from './pkg/pkg.sw'
export type Manifest = chrome.runtime.Manifest

export class PkgsLoader extends $sw.Unit {
  private $pkgs = this.up($sw.Pkgs)!

  static async create(parent: $sw.Unit) {
    const loader = new PkgsLoader(parent)
    await loader.init()
    return loader
  }

  private async init() {
    const [bundle] = await this.$.utils.safe<BundleNoAssets>(fetch('/project.json').then(res => res.json()))
    if (!bundle) return

    const [manifest] = await this.$.utils.safe<Manifest>(fetch('/manifest.json').then(res => res.json()))
    if (!manifest) return

    const name = bundle.spec.name
    const pkg = this.$pkgs.map[name]
    if (!pkg) return

    // const shouldLoad = !pkg || manifest.version < bundle.spec.manifest.version
    // if (this.$pkgs.map[bundle.spec.name]) {
    // }

    await this.$.idb.set(bundle.spec.name, ':pkg', ':default', bundle)

    for (const path of bundle.spec.assets) {
      const [blob] = await this.$.utils.safe(fetch(`/assets/${path}`).then(r => r.blob()))
      if (!blob) continue
      await this.$.idb.set(bundle.spec.name, ':assets', path, blob)
    }
  }
}
