export class ProjectEposAssets extends ex.Unit {
  private $epos = this.closest(ex.ProjectEpos)!
  private $project = this.closest(ex.Project)!
  private files: { [path: string]: { url: string; blob: Blob } } = {}
  private paths: string[] = []

  async init() {
    this.paths = await this.$.idb.keys(this.$project.id, ':assets')
  }

  async load(path?: string) {
    // No path provided? -> Load all assets
    if (this.$.utils.is.undefined(path)) {
      await Promise.all(this.paths.map(path => this.load(path)))
      return
    }

    // Already loaded? -> Skip
    const normalizedPath = this.normalizePath(path, this.load)
    if (this.files[normalizedPath]) return

    // Read the asset from IndexedDB
    const blob = await this.get(normalizedPath)
    if (!blob) return

    // Store in memory
    this.files[normalizedPath] = { url: URL.createObjectURL(blob), blob }
  }

  unload(path?: string) {
    // No path provided? -> Unload all assets
    if (this.$.utils.is.undefined(path)) {
      Object.keys(this.files).forEach(path => this.unload(path))
      return
    }

    // Asset not loaded? -> Skip
    const normalizedPath = this.normalizePath(path, this.unload)
    if (!this.files[normalizedPath]) return

    // Revoke URL and remove from memory
    URL.revokeObjectURL(this.files[normalizedPath].url)
    delete this.files[normalizedPath]
  }

  url(path: string) {
    const normalizedPath = this.normalizePath(path, this.url)
    if (!this.files[normalizedPath]) {
      const message = `Asset not loaded: "${path}"`
      const tip1 = `Call epos.assets.load("${path}") first`
      const tip2 = `Or call epos.assets.load() to load all assets`
      throw this.$epos.error(`${message}. ${tip1}. ${tip2}`, this.url)
    }

    return this.files[normalizedPath].url
  }

  async get(path: string) {
    const normalizedPath = this.normalizePath(path, this.get)
    if (this.files[normalizedPath]) return this.files[normalizedPath].blob
    return await this.$.idb.get<Blob>(this.$project.id, ':assets', normalizedPath)
  }

  list(filter: { loaded?: boolean } = {}) {
    return this.paths
      .map(path => ({
        path: path,
        loaded: path in this.files,
      }))
      .filter(file => {
        if (this.$.utils.is.undefined(filter.loaded)) return true
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
  private normalizePath(path: string, caller: Fn) {
    const normalizedPath = path
      .split('/')
      .filter(part => part !== '' && part !== '.')
      .join('/')

    if (!this.paths.includes(normalizedPath)) {
      const message = `Asset not found: "${path}"`
      const tip = `Ensure it is listed in epos.json "assets" field`
      throw this.$epos.error(`${message}. ${tip}.`, caller)
    }

    return normalizedPath
  }
}
