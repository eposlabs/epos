import type { Spec, Assets } from './pkg/pkg.sw'

export type Pack = { spec: Spec; assets: Assets }

export class PackInstaller extends $sw.Unit {
  private $pack = this.up($sw.Pack)!
  private queue = new this.$.utils.Queue()

  constructor(parent: $sw.Unit) {
    super(parent)
    this.install = this.queue.wrap(this.install, this)
    this.remove = this.queue.wrap(this.remove, this)
  }

  async install(input: string | Pack, dev = false) {
    if (this.$.is.object(input)) {
      await this.installFromPack(input)
    } else if (URL.canParse(input)) {
      await this.installFromUrl(input, dev)
    } else {
      await this.installByName(input, dev)
    }

    this.broadcast('pkgs.changed')
  }

  async remove(name: string) {
    await this.$.idb.deleteDatabase(name)
    delete this.$pack.pkgs[name]
    this.broadcast('pkgs.changed')
  }

  private async installByName(name: string, dev = false) {
    const url = `https://epos.dev/@/${name}/epos.json`
    return await this.installFromUrl(url, dev)
  }

  private async installFromUrl(url: string, dev = false) {
    // Parse url
    const parsed = URL.parse(url)
    if (!parsed) throw new Error(`Invalid URL: ${url}`)

    // Ensure url path ends with '/epos.json'
    if (!parsed.pathname.endsWith('/epos.json')) {
      url = new URL('epos.json', parsed.href).href
    }

    // Fetch epos.json
    const [res] = await this.$.utils.safe(fetch(url))
    if (!res) throw new Error(`Failed to fetch ${url}`)

    // Read epos.json
    const [json, readError] = await this.$.utils.safe(res.text().then(this.$.libs.stripJsonComments))
    if (readError) throw new Error(`Failed to parse ${url}: ${readError.message}`)
    const [data, jsonError] = this.$.utils.safe.sync(() => JSON.parse(json))
    if (jsonError) throw new Error(`Failed to parse ${url}: ${jsonError.message}`)

    // Parse manifest
    const manifest = this.$pack.parser.parseManifest(data)

    // Fetch assets
    const assets: Record<string, Blob> = {}
    for (const path of manifest.assets) {
      const assetUrl = new URL(path, url)
      const [res] = await this.$.utils.safe(fetch(assetUrl))
      if (!res?.ok) throw new Error(`Failed to fetch: ${assetUrl}`)
      const [blob] = await this.$.utils.safe(res.blob())
      if (!blob) throw new Error(`Failed to fetch: ${assetUrl.href}`)
      assets[path] = blob
    }

    // Fetch sources
    const sources: Record<string, string> = {}
    for (const target of manifest.targets) {
      for (const path of target.load) {
        if (path in sources) continue
        const sourceUrl = new URL(path, url).href
        const [res] = await this.$.utils.safe(fetch(sourceUrl))
        if (!res?.ok) throw new Error(`Failed to fetch: ${sourceUrl}`)
        const [text] = await this.$.utils.safe(res.text())
        if (!text) throw new Error(`Failed to fetch: ${sourceUrl}`)
        sources[path] = text.trim()
      }
    }

    await this.installFromPack({
      spec: { dev, name: manifest.name, manifest, sources },
      assets: assets,
    })
  }

  private async installFromPack(pack: Pack) {
    if (this.$pack.pkgs[pack.spec.name]) {
      const pkg = this.$pack.pkgs[pack.spec.name]
      await pkg.update(pack.spec, pack.assets)
    } else {
      const pkg = await $sw.Pkg.create(this, pack.spec, pack.assets)
      this.$pack.pkgs[pack.spec.name] = pkg
    }
  }

  private broadcast(event: string) {
    async: this.$.bus.send(event)
    async: this.$.bus.emit(event)
  }
}
