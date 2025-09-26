export class PkgsLoader extends $sw.Unit {
  static async create(parent: $sw.Unit) {
    const loader = new PkgsLoader(parent)
    await loader.init()
    return loader
  }

  private async init() {
    const dbNames = await this.$.idb.listDatabases()
    if (dbNames.length > 0) return

    const [pkg] = await this.$.utils.safe(fetch('/pkg.json').then(r => r.json()))
    if (!pkg) return

    await this.$.idb.set(pkg.name, ':pkg', ':default', pkg)

    for (const path of pkg.manifest.assets) {
      const [blob] = await this.$.utils.safe(fetch(`/assets/${path}`).then(r => r.blob()))
      if (!blob) continue
      await this.$.idb.set(pkg.name, ':assets', path, blob)
    }
  }
}
