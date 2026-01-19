export type Area = 'local' | 'session' | 'sync'

export class ProjectBrowserStorageArea extends sw.Unit {
  private $browser = this.closest(sw.ProjectBrowser)!
  private area: Area
  private queue = new this.$.utils.Queue()

  get api() {
    return this.$.browser.storage[this.area]
  }

  constructor(parent: sw.Unit, area: Area) {
    super(parent)
    this.clear = this.queue.wrap(this.clear, this)
    this.get = this.queue.wrap(this.get, this)
    this.getKeys = this.queue.wrap(this.getKeys, this)
    this.remove = this.queue.wrap(this.remove, this)
    this.set = this.queue.wrap(this.set, this)
    this.area = area
  }

  async dispose() {
    await this.clear()
  }

  async clear() {
    const projectKeys = await this.getProjectKeys()
    await this.api.remove(projectKeys)
  }

  async get(keysArg?: string | string[] | Obj | null) {
    if (!this.$.utils.is.present(keysArg)) {
      const data = await this.api.get(null)
      return this.unprefixObject(data)
    } else if (this.$.utils.is.object(keysArg)) {
      const query = this.prefixObject(keysArg)
      const data = await this.api.get(query)
      return this.unprefixObject(data)
    } else {
      const keys = this.$.utils.ensureArray(keysArg).map(key => this.$browser.prefix(key))
      const data = await this.api.get(keys)
      return this.unprefixObject(data)
    }
  }

  async getBytesInUse(keysArg?: string | string[]) {
    const keys = this.$.utils.is.present(keysArg)
      ? this.$.utils.ensureArray(keysArg).map(key => this.$browser.prefix(key))
      : await this.getProjectKeys()
    return await this.api.getBytesInUse(keys)
  }

  async getKeys() {
    const projectKeys = await this.getProjectKeys()
    return projectKeys.map(key => this.$browser.unprefix(key))
  }

  async remove(keysArg: string | string[]) {
    const keys = this.$.utils.ensureArray(keysArg).map(key => this.$browser.prefix(key))
    await this.api.remove(keys)
  }

  async set(dataArg: Obj) {
    const data = this.prefixObject(dataArg)
    await this.api.set(data)
  }

  onChanged(changes: { [key: string]: chrome.storage.StorageChange }) {
    const unprefixedChanges = this.unprefixObject(changes)
    if (Object.keys(unprefixedChanges).length === 0) return
    return [unprefixedChanges]
  }

  private async getProjectKeys() {
    const allKeys = await this.api.getKeys()
    return allKeys.filter(key => this.$browser.isPrefixed(key))
  }

  private prefixObject(object: Obj) {
    const prefixed: Obj = {}
    for (const [key, value] of Object.entries(object)) {
      prefixed[this.$browser.prefix(key)] = value
    }
    return prefixed
  }

  private unprefixObject(object: Obj) {
    const unprefixed: Obj = {}
    for (const [key, value] of Object.entries(object)) {
      if (!this.$browser.isPrefixed(key)) continue
      unprefixed[this.$browser.unprefix(key)] = value
    }
    return unprefixed
  }
}
