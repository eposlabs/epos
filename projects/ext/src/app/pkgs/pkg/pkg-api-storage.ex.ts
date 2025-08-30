export class PkgApiStorage extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!

  get = async (key: string, name?: string) => {
    this.validateKey(key)
    this.validateName(name)
    name ??= ':storage'
    return await this.$.idb.get(this.$pkg.name, name, key)
  }

  set = async (key: string, value: unknown, name?: string) => {
    this.validateKey(key)
    this.validateName(name)
    name ??= ':storage'
    return await this.$.idb.set(this.$pkg.name, name, key, value)
  }

  delete = async (key: string, name?: string) => {
    this.validateKey(key)
    this.validateName(name)
    name ??= ':storage'
    return await this.$.idb.delete(this.$pkg.name, name, key)
  }

  keys = async (name?: string) => {
    this.validateName(name)
    name ??= ':storage'
    return await this.$.idb.keys(this.$pkg.name, name)
  }

  clear = async (name?: string) => {
    this.validateName(name)
    name ??= ':storage'
    return await this.$.idb.deleteStore(this.$pkg.name, name)
  }

  storage = (name?: string) => {
    this.validateName(name)
    name ??= ':storage'

    return {
      get: (key: string) => this.get(key, name),
      set: (key: string, value: unknown) => this.set(key, value, name),
      delete: (key: string) => this.delete(key, name),
      keys: () => this.keys(name),
      clear: () => this.clear(name),
    }
  }

  storages = async () => {
    const stores = await this.$.idb.listStores(this.$pkg.name)
    const names = stores.filter(store => store === ':storage' || !store.startsWith(':'))
    return names.map(name => ({ name: name === ':storage' ? null : name }))
  }

  private validateName(name?: string) {
    if (this.$.is.undefined(name)) return
    if (!this.$.is.string(name)) {
      throw new Error('Invalid storage name, string expected')
    } else if (name.length === 0) {
      throw new Error('Invalid storage name, non-empty string expected')
    } else if (name.startsWith(':')) {
      throw new Error('Invalid storage name, cannot start with ":"')
    }
  }

  private validateKey(key: string) {
    if (!this.$.is.string(key)) {
      throw new Error('Invalid storage key, string expected')
    } else if (key.length === 0) {
      throw new Error('Invalid storage key, non-empty string expected')
    }
  }
}
