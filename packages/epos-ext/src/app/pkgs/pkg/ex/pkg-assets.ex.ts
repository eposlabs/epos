export type Asset = {
  blob: Blob
  url: string | null
}

export class PkgAssets extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!
  private loaded: { [path: string]: Asset } = {}

  url = (path: string) => {
    this.validatePath(path)
    path = this.normalizePath(path)
    const asset = this.loaded[path]
    if (!asset) throw new Error(`Asset does not exist or is not loaded: ${path}`)
    asset.url ??= URL.createObjectURL(asset.blob)
    return asset.url
  }

  load = async (path: string) => {
    this.validatePath(path)

    if (path === '*') {
      const assets = await this.assets({ loaded: false })
      const paths = assets.map(asset => asset.path)
      await Promise.all(paths.map(path => this.load(path)))
    } else {
      path = this.normalizePath(path)
      if (this.loaded[path]) return
      const blob = await this.$.idb.get<Blob>(this.$pkg.name, ':assets', path)
      if (!blob) throw new Error(`Asset not found: ${path}`)
      this.loaded[path] = { blob, url: null }
    }
  }

  unload = (path: string) => {
    this.validatePath(path)

    if (path === '*') {
      const paths = Object.keys(this.loaded)
      paths.forEach(path => this.unload(path))
    } else {
      path = this.normalizePath(path)
      const asset = this.loaded[path]
      if (!asset) return
      if (asset.url) URL.revokeObjectURL(asset.url)
      delete this.loaded[path]
    }
  }

  assets = async (opts: { loaded?: boolean } = {}) => {
    const paths = await this.$.idb.keys(this.$pkg.name, ':assets')
    return paths
      .map(path => ({
        path: path,
        loaded: path in this.loaded,
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

  private validatePath(path: string) {
    if (!this.$.is.string(path)) {
      throw new Error('Invalid asset path, string expected')
    } else if (path.length === 0) {
      throw new Error('Invalid asset path, non-empty string expected')
    }
  }
}
