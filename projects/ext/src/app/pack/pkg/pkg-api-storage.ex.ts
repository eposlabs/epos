export class PkgApiStorage extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!

  async get(key: string, name?: string) {
    name ??= ':storage'
    return await this.$.idb.get(this.$pkg.name, name, key)
  }

  async set(key: string, value: unknown, name?: string) {
    name ??= ':storage'
    return await this.$.idb.set(this.$pkg.name, name, key, value)
  }

  async delete(key: string, name?: string) {
    name ??= ':storage'
    return await this.$.idb.delete(this.$pkg.name, name, key)
  }

  async keys(name?: string) {
    name ??= ':storage'
    return await this.$.idb.keys(this.$pkg.name, name)
  }

  async clear(name?: string) {
    name ??= ':storage'
    return await this.$.idb.deleteStore(this.$pkg.name, name)
  }

  use(name?: string) {
    name ??= ':storage'
    return {
      get: (key: string) => this.get(key, name),
      set: (key: string, value: unknown) => this.set(key, value, name),
      delete: (key: string) => this.delete(key, name),
      keys: () => this.keys(name),
      clear: () => this.clear(name),
    }
  }

  async list() {
    const stores = await this.$.idb.listStores(this.$pkg.name)
    const names = stores.filter(store => store === ':storage' || !store.startsWith(':'))
    return names.map(name => ({ name: name === ':storage' ? null : name }))
  }
}
