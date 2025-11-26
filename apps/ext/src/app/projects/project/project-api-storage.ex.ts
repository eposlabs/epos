export class ProjectApiStorage extends ex.Unit {
  private $api = this.closest(ex.ProjectApi)!
  private $project = this.closest(ex.Project)!

  async get(key: string, name?: string) {
    name = this.prepareName(name, this.get)
    return await this.$.idb.get(this.$project.name, name, key)
  }

  async set(key: string, value: unknown, name?: string) {
    name = this.prepareName(name, this.set)
    return await this.$.idb.set(this.$project.name, name, key, value)
  }

  async delete(key: string, name?: string) {
    name = this.prepareName(name, this.delete)
    return await this.$.idb.delete(this.$project.name, name, key)
  }

  async keys(name?: string) {
    name = this.prepareName(name, this.keys)
    return await this.$.idb.keys(this.$project.name, name)
  }

  async clear(name?: string) {
    name = this.prepareName(name, this.clear)
    return await this.$.idb.deleteStore(this.$project.name, name)
  }

  use(name?: string) {
    name = this.prepareName(name, this.use)
    return {
      get: (key: string) => this.get(key, name),
      set: (key: string, value: unknown) => this.set(key, value, name),
      delete: (key: string) => this.delete(key, name),
      keys: () => this.keys(name),
      clear: () => this.clear(name),
    }
  }

  async list() {
    const stores = await this.$.idb.listStores(this.$project.name)
    const names = stores.filter(store => store === ':storage' || !store.startsWith(':'))
    return names.map(name => ({ name: name === ':storage' ? null : name }))
  }

  private prepareName(name: string | null | undefined, caller: Fn) {
    if (this.$.utils.is.absent(name)) return ':storage'
    if (name === '') throw this.$api.error('Storage name cannot be empty string', caller)
    if (name.startsWith(':')) throw this.$api.error(`Storage name cannot start with ':'`, caller)
    return name
  }
}
