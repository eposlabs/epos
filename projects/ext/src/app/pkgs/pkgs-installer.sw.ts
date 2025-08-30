import type { Data, Assets } from './pkg/pkg.sw'

export type Pack = { data: Data; assets: Assets }

// TODO: throw if pkg already exists (installed)
export class PkgsInstaller extends $sw.Unit {
  private $pkgs = this.up($sw.Pkgs)!
  private queue = new this.$.utils.Queue()

  constructor(parent: $sw.Unit) {
    super(parent)
    this.install = this.queue.wrap(this.install, this)
    this.remove = this.queue.wrap(this.remove, this)
    this.$.bus.on('pkgs.install', this.install, this)
  }

  async install(input: string | Pack) {
    if (this.$.is.object(input)) {
      await this.installFromPack(input)
    } else if (URL.canParse(input)) {
      await this.installFromUrl(input)
    } else {
      await this.installByName(input)
    }

    this.broadcastUpdated()
  }

  async remove(name: string) {
    await this.$.idb.deleteDatabase(name)
    delete this.$pkgs.map[name]
    this.broadcastUpdated()
  }

  private async installByName(name: string) {
    const url = `https://epos.dev/@/${name}/epos.json`
    return await this.installFromUrl(url)
  }

  private async installFromUrl(url: string) {
    // Parse url
    const parsed = URL.parse(url)
    if (!parsed) throw new Error(`Invalid URL: ${url}`)

    // Ensure url path ends with '/epos.json'
    if (!parsed.pathname.endsWith('/epos.json')) {
      parsed.pathname = `${parsed.pathname}/epos.json`
      url = parsed.href
    }

    // Fetch epos.json
    const [res] = await this.$.utils.safe(() => fetch(url))
    if (!res) throw new Error(`Failed to fetch ${url}`)

    // Read epos.json
    const [data, error] = await this.$.utils.safe(() => res.json())
    if (error) throw new Error(`Failed to parse ${url}: ${error.message}`)

    // Parse manifest
    const manifest = this.$pkgs.parser.parseManifest(data)

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
        sources[path] = text
      }
    }

    await this.installFromPack({
      data: { name: manifest.name, dev: false, manifest, sources },
      assets: assets,
    })
  }

  private async installFromPack(pack: Pack) {
    if (this.$pkgs.map[pack.data.name]) {
      const pkg = this.$pkgs.map[pack.data.name]
      await pkg.update(pack.data, pack.assets)
    } else {
      const pkg = await $sw.Pkg.create(this, pack.data, pack.assets)
      this.$pkgs.map[pack.data.name] = pkg
    }
  }

  private broadcastUpdated() {
    async: this.$.bus.send('pkgs.updated')
    async: this.$.bus.emit('pkgs.updated')
  }
}
