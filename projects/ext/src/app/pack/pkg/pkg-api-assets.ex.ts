export class PkgApiAssets extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!
  private urls: { [path: string]: string | null } = {}
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
    if (!this.urls[path]) throw new Error(`Asset does not exist or is not loaded: ${path}`)
    return this.urls[path]
  }

  async load(path: string) {
    if (path === '*') {
      await Promise.all(this.paths.map(path => this.load(path)))
      return
    }

    path = this.normalizePath(path)
    if (this.urls[path]) return
    const blob = await this.$.idb.get<Blob>(this.$pkg.name, ':assets', path)
    if (!blob) throw new Error(`Asset not found: ${path}`)
    this.urls[path] = URL.createObjectURL(blob)
  }

  unload(path: string) {
    if (path === '*') {
      const paths = Object.keys(this.urls)
      paths.forEach(path => this.unload(path))
      return
    }

    path = this.normalizePath(path)
    const url = this.urls[path]
    if (!url) return
    URL.revokeObjectURL(url)
    delete this.urls[path]
  }

  list(opts: { loaded?: boolean } = {}) {
    return this.paths
      .map(path => ({
        path: path,
        loaded: path in this.urls,
      }))
      .filter(asset => {
        if (this.$.is.undefined(opts.loaded)) return true
        return opts.loaded === asset.loaded
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
