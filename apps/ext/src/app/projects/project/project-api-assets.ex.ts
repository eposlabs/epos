export class ProjectApiAssets extends ex.Unit {
  private $api = this.up(ex.ProjectApi)!
  private $project = this.up(ex.Project)!
  private files: { [path: string]: { url: string; blob: Blob } } = {}
  private paths: string[] = []

  async init() {
    this.paths = await this.$.idb.keys(this.$project.name, ':assets')
  }

  url(path: string) {
    path = this.normalizePath(path)
    if (!this.paths.includes(path)) throw this.$api.error(`File does not exist: ${path}`, this.url)
    if (!this.files[path]) throw this.$api.error(`File is not loaded: ${path}`, this.url)
    return this.files[path].url
  }

  async load(path: string) {
    if (arguments.length === 0) {
      await this.loadAll()
      return
    }

    path = this.normalizePath(path)
    if (this.files[path]) return this.files[path].blob
    const blob = await this.$.idb.get<Blob>(this.$project.name, ':assets', path)
    if (!blob) throw this.$api.error(`File not found: ${path}`, this.load)
    this.files[path] = { url: URL.createObjectURL(blob), blob }
    return blob
  }

  unload(path: string) {
    if (arguments.length === 0) {
      this.unloadAll()
      return
    }

    path = this.normalizePath(path)
    if (!this.files[path]) return
    URL.revokeObjectURL(this.files[path].url)
    delete this.files[path]
  }

  private async loadAll() {
    return await Promise.all(this.paths.map(path => this.load(path)))
  }

  private unloadAll() {
    Object.keys(this.files).forEach(path => this.unload(path))
  }

  list(filter: { loaded?: boolean } = {}) {
    return this.paths
      .map(path => ({
        path: path,
        loaded: path in this.files,
      }))
      .filter(file => {
        if (this.$.is.undefined(filter.loaded)) return true
        return filter.loaded === file.loaded
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
