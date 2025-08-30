import type { PkgData } from './pkg/sw/pkg.sw'
import type { Manifest } from './pkgs-parser.sw'

export type Pack = {
  name: string
  dev: boolean
  manifest: Manifest
  assets: Record<string, Blob>
  sources: Record<string, string>
}

export class PkgsInstaller extends $sw.Unit {
  private $pkgs = this.up($sw.Pkgs)!
  private queue = new this.$.utils.Queue()

  constructor(parent: $sw.Unit) {
    super(parent)
    this.install = this.queue.wrap(this.install, this)
    this.remove = this.queue.wrap(this.remove, this)
    this.$.bus.on('pkgs.install', this.install, this)
  }

  async install(target: string | Pack) {
    if (this.$.is.object(target)) {
      await this.installFromPack(target)
    } else if (URL.canParse(target)) {
      await this.installFromUrl(target)
    } else {
      await this.installByName(target)
    }
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
    const [res] = await this.$.safe(() => fetch(url))
    if (!res) throw new Error(`Failed to fetch ${url}`)

    // Read epos.json
    const [data, error] = await this.$.safe(() => res.json())
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
      name: manifest.name,
      dev: false,
      manifest: manifest,
      assets: assets,
      sources: sources,
    })
  }

  private async installFromPack(pack: Pack) {
    this.log('PACK', pack)
  }

  async _install(nameOrData: string | PkgData) {
    let data: PkgData
    if (this.$.utils.is.string(nameOrData)) {
      data = await this.fetchPkg(nameOrData)
    } else {
      data = nameOrData
    }

    const name = data.name
    if (this.$pkgs.map[name]) {
      const pkg = this.$pkgs.map[name]
      await pkg.applyData(data)
    } else {
      const pkg = await $sw.Pkg.create(this, data)
      this.$pkgs.map[name] = pkg
    }

    this.notifyPkgsChanged()
  }

  async remove(name: string) {
    await this.$.idb.deleteDatabase(name)
    delete this.$pkgs.map[name]
    this.notifyPkgsChanged()
  }

  private async fetchPkg(name: string): Promise<PkgData> {
    // Find manifest
    const { manifest, dev } = await this.findManifest(name)

    // Prepare path resolver
    const hub = this.$.env.url.hub(dev)
    const resolve = (path: string) => new URL(`/@/${name}/${path}`, hub).href

    // Fetch all assets
    const assets: { [path: string]: Blob } = {}
    for (const path of manifest.assets) {
      if (assets[path]) continue
      const url = resolve(path)
      const [blob, error] = await this.$.safe(() => fetch(url).then(r => r.blob()))
      if (error) throw new Error(`Failed to fetch ${url}`)
      assets[path] = blob
    }

    // Fetch all src
    const src: { [path: string]: string } = {}
    for (const bundle of manifest.bundles) {
      for (const path of bundle.src) {
        const url = resolve(path)
        const [text, error] = await this.$.safe(() => fetch(url).then(r => r.text()))
        if (error) throw new Error(`Failed to fetch ${url}`)
        src[path] = text.trim()
      }
    }

    return { name, dev, src, assets, manifest }
  }

  private async findManifest(name: string) {
    const devManifest = await this.fetchManifest(name, true)
    if (devManifest) return { manifest: devManifest, dev: true }

    const prodManifest = await this.fetchManifest(name, false)
    if (prodManifest) return { manifest: prodManifest, dev: false }

    throw new Error(`Package '${name}' not found`)
  }

  private async fetchManifest(name: string, dev = false) {
    // Fetch manifest
    const hub = this.$.env.url.hub(dev)
    const url = new URL(`/@/${name}/epos.json`, hub).href
    const [res] = await this.$.safe(() => fetch(url))

    // Failed to fetch? -> Return null for dev hub (no server running) or throw error
    if (!res) {
      if (dev) return null
      throw new Error(`Failed to fetch ${url}`)
    }

    // Not found? -> Return null
    if (!res.ok) return null

    // Read manifest text
    const [json] = await this.$.safe(() => res.text())
    if (!json) throw new Error(`Failed to fetch manifest ${url}`)

    // Parse json
    const [manifest] = this.$.safe.sync(() => JSON.parse(json))
    if (!manifest) throw new Error(`Failed to parse manifest ${url}`)

    return manifest as Manifest
  }

  private notifyPkgsChanged() {
    async: this.$.bus.send('pkgs.changed')
    async: this.$.bus.emit('pkgs.changed')
  }
}
