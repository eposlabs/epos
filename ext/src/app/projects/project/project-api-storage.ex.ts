export class ProjectApiStorage extends ex.Unit {
  private $project = this.up(ex.Project)!

  async get(key: string, name?: string) {
    name = this.prepareName(name)
    return await this.$.idb.get(this.$project.name, name, key)
  }

  async set(key: string, value: unknown, name?: string) {
    name = this.prepareName(name)
    return await this.$.idb.set(this.$project.name, name, key, value)
  }

  async delete(key: string, name?: string) {
    name = this.prepareName(name)
    return await this.$.idb.delete(this.$project.name, name, key)
  }

  async keys(name?: string) {
    name = this.prepareName(name)
    return await this.$.idb.keys(this.$project.name, name)
  }

  async clear(name?: string) {
    name = this.prepareName(name)
    return await this.$.idb.deleteStore(this.$project.name, name)
  }

  use(name?: string) {
    name = this.prepareName(name)
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

  private prepareName(name?: string) {
    if (this.$.is.absent(name)) return ':storage'
    if (name === '') throw new Error('Storage name cannot be empty string')
    if (name.startsWith(':')) throw new Error(`Storage name cannot start with ':'`)
    return name
  }
}
