import type { Manifest } from 'epos-types'
import type { PkgData } from './pkg/sw/pkg.sw'

export class PkgsInstaller extends $sw.Unit {
  private $pkgs = this.up($sw.Pkgs)!
  private queue = new this.$.utils.Queue()

  constructor(parent: $sw.Unit) {
    super(parent)
    this.install = this.queue.wrap(this.install, this)
    this.remove = this.queue.wrap(this.remove, this)
    this.$.bus.on('pkgs.install', this.install, this)
  }

  async newInstall(target: string | { manifest: Manifest; files: Record<string, Blob> }) {
    // Data
    if (!this.$.is.string(target)) {
      const { manifest, files } = target
      this.log('Data', { manifest, files })
    }

    // Url
    else if (URL.canParse(target)) {
      this.log('Url', target)
    }

    // Name
    else {
      this.log('Name', target)
    }
  }

  async install(nameOrData: string | PkgData) {
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
