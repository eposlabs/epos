export class PkgApiAssets extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!
  private assets: { [path: string]: { url: string; blob: Blob } } = {}
  private paths: string[] = []

  static async create(parent: $ex.Unit) {
    const pkgApiAssets = new PkgApiAssets(parent)
    await pkgApiAssets.init()
    return pkgApiAssets
  }

  private async init() {
    this.paths = await this.$.idb.keys(this.$pkg.name, ':assets')
  }

  url(path: string) {
    path = this.normalizePath(path)
    if (!this.assets[path]) throw new Error(`Asset does not exist or is not loaded: ${path}`)
    return this.assets[path].url
  }

  async load(path: string) {
    path = this.normalizePath(path)
    if (this.assets[path]) return this.assets[path].blob
    const blob = await this.$.idb.get<Blob>(this.$pkg.name, ':assets', path)
    if (!blob) throw new Error(`Asset not found: ${path}`)
    this.assets[path] = { url: URL.createObjectURL(blob), blob }
    return blob
  }

  async loadAll() {
    return await Promise.all(this.paths.map(path => this.load(path)))
  }

  unload(path: string) {
    path = this.normalizePath(path)
    if (!this.assets[path]) return
    URL.revokeObjectURL(this.assets[path].url)
    delete this.assets[path]
  }

  unloadAll() {
    Object.keys(this.assets).forEach(path => this.unload(path))
  }

  list(filter: { loaded?: boolean } = {}) {
    return this.paths
      .map(path => ({
        path: path,
        loaded: path in this.assets,
      }))
      .filter(asset => {
        if (this.$.is.undefined(filter.loaded)) return true
        return filter.loaded === asset.loaded
      })
  }

  /**
   * normalizePath('a/c') -> 'a/c'
   * normalizePath('a/c/') -> 'a/c'
   * normalizePath('/a/c/') -> 'a/c'
   * normalizePath('./a/c') -> 'a/c'
   * normalizePath('a/./c') -> 'a/c'
   */
  private normalizePath(path: string) {
    return path
      .split('/')
      .filter(p => p !== '' && p !== '.')
      .join('/')
  }
}
