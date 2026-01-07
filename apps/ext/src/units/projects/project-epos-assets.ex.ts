export class ProjectEposAssets extends ex.Unit {
  private $epos = this.closest(ex.ProjectEpos)!
  private $project = this.closest(ex.Project)!
  private files: { [path: string]: { url: string; blob: Blob } } = {}
  private paths: string[] = []

  async init() {
    this.paths = await this.$.idb.keys(this.$project.id, ':assets')
  }

  async load(pathArg?: unknown) {
    // No path provided? -> Load all assets
    if (this.$.utils.is.undefined(pathArg)) {
      await Promise.all(this.paths.map(path => this.load(path)))
      return
    }

    // Already loaded? -> Skip
    const path = this.preparePath(pathArg, this.load)
    if (this.files[path]) return

    // Read the asset from IndexedDB
    const blob = await this.get(path)
    if (!blob) return

    // Store in memory
    this.files[path] = { url: URL.createObjectURL(blob), blob }
  }

  unload(pathArg?: string) {
    // No path provided? -> Unload all assets
    if (this.$.utils.is.undefined(pathArg)) {
      Object.keys(this.files).forEach(path => this.unload(path))
      return
    }

    // Asset not loaded? -> Skip
    const path = this.preparePath(pathArg, this.unload)
    if (!this.files[path]) return

    // Revoke URL and remove from memory
    URL.revokeObjectURL(this.files[path].url)
    delete this.files[path]
  }

  url(pathArg: unknown) {
    const path = this.preparePath(pathArg, this.url)

    if (!this.files[path]) {
      throw this.$epos.error(
        `Asset must be loaded before accessing URL: '${path}'. Call epos.assets.load(path?) first.`,
        this.url,
      )
    }

    return this.files[path].url
  }

  async get(pathArg: unknown) {
    const path = this.preparePath(pathArg, this.get)
    if (this.files[path]) return this.files[path].blob
    return await this.$.idb.get<Blob>(this.$project.id, ':assets', path)
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
   * preparePath('a/c') -> 'a/c'
   * preparePath('a/c/') -> 'a/c'
   * preparePath('/a/c/') -> 'a/c'
   * preparePath('./a/c') -> 'a/c'
   * preparePath('a/./c') -> 'a/c'
   */
  private preparePath(path: unknown, caller: Fn) {
    if (!this.$.utils.is.string(path)) {
      throw this.$epos.error(`Asset path must be a string`, caller)
    }

    const normalizedPath = path
      .split('/')
      .filter(part => part !== '' && part !== '.')
      .join('/')

    if (!this.paths.includes(normalizedPath)) {
      throw this.$epos.error(
        `Asset not found: '${path}'. Ensure it is listed in epos.json 'assets' field.`,
        caller,
      )
    }

    return normalizedPath
  }
}
