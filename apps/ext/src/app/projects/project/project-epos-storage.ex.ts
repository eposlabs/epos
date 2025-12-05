export const DEFAULT_STORAGE_NAME = ':storage'

export class ProjectEposStorage extends ex.Unit {
  private $epos = this.closest(ex.ProjectEpos)!
  private $project = this.closest(ex.Project)!
  static DEFAULT_STORAGE_NAME = DEFAULT_STORAGE_NAME

  async get<T = unknown>(key: string): Promise<T | null>
  async get<T = unknown>(name: string, key: string): Promise<T | null>
  async get<T = unknown>(...args: unknown[]): Promise<T | null> {
    let nameArg: unknown
    let keyArg: unknown
    if (args.length === 1) {
      nameArg = null
      keyArg = args[0]
    } else if (args.length === 2) {
      nameArg = args[0]
      keyArg = args[1]
    } else {
      throw this.$epos.error(`Invalid number of arguments, expected 1 or 2, got ${args.length}`, this.get)
    }

    const name = this.prepareName(nameArg, this.get)
    const key = this.prepareKey(keyArg, this.get)
    return await this.$.idb.get<T>(this.$project.name, name, key)
  }

  async set(key: string, value: string): Promise<void>
  async set(name: string, key: string, value: unknown): Promise<void>
  async set(...args: unknown[]): Promise<void> {
    let nameArg: unknown
    let keyArg: unknown
    let valueArg: unknown
    if (args.length === 2) {
      nameArg = null
      keyArg = args[0]
      valueArg = args[1]
    } else if (args.length === 3) {
      nameArg = args[0]
      keyArg = args[1]
      valueArg = args[2]
    } else {
      throw this.$epos.error(`Invalid number of arguments, expected 2 or 3, got ${args.length}`, this.set)
    }

    const name = this.prepareName(nameArg, this.set)
    const key = this.prepareKey(keyArg, this.set)
    const value = this.prepareValue(valueArg)
    await this.$.idb.set(this.$project.name, name, key, value)
  }

  async delete(key: string): Promise<void>
  async delete(name: string, key: string): Promise<void>
  async delete(...args: unknown[]): Promise<void> {
    let nameArg: unknown
    let keyArg: unknown
    if (args.length === 1) {
      nameArg = null
      keyArg = args[0]
    } else if (args.length === 2) {
      nameArg = args[0]
      keyArg = args[1]
    } else {
      throw this.$epos.error(`Invalid number of arguments, expected 1 or 2, got ${args.length}`, this.delete)
    }

    const name = this.prepareName(nameArg, this.delete)
    const key = this.prepareKey(keyArg, this.delete)
    await this.$.idb.delete(this.$project.name, name, key)
  }

  async keys(nameArg?: string) {
    const name = this.prepareName(nameArg, this.keys)
    return await this.$.idb.keys(this.$project.name, name)
  }

  async clear(nameArg?: string) {
    const name = this.prepareName(nameArg, this.clear)
    return await this.$.idb.deleteStore(this.$project.name, name)
  }

  use(nameArg?: string) {
    const name = this.prepareName(nameArg, this.use)
    return {
      get: <T = unknown>(key: string) => this.get<T>(name, key),
      set: (key: string, value: unknown) => this.set(name, key, value),
      delete: (key: string) => this.delete(name, key),
      keys: () => this.keys(name),
      clear: () => this.clear(name),
    }
  }

  async list() {
    const names = await this.$.idb.listStores(this.$project.name)
    return names.map(name => ({ name: name === DEFAULT_STORAGE_NAME ? null : name }))
  }

  private prepareName(name: unknown, caller: Fn) {
    if (this.$.utils.is.absent(name)) {
      return DEFAULT_STORAGE_NAME
    }

    if (!this.$.utils.is.string(name)) {
      throw this.$epos.error(`Storage name must be a string`, caller)
    }

    if (name === '') {
      throw this.$epos.error(`Storage name must be a non-empty string`, caller)
    }

    if (name.length > 30) {
      throw this.$epos.error(`Storage name is too long: '${name}'`, caller)
    }

    const regex = /^[a-zA-Z0-9-_]+$/
    if (!regex.test(name)) {
      throw this.$epos.error(
        `Invalid storage name: '${name}'; allowed chars: a-z, A-Z, 0-9, '-', and '_'`,
        caller,
      )
    }

    return name
  }

  private prepareKey(key: unknown, caller: Fn) {
    if (!this.$.utils.is.string(key)) {
      throw this.$epos.error(`Storage key must be a string`, caller)
    }

    if (key.length === 0) {
      throw this.$epos.error('Storage key must be a non-empty string', caller)
    }

    if (key.length > 100) {
      throw this.$epos.error(`Storage key is too long: '${key}'`, caller)
    }

    return key
  }

  private prepareValue(value: unknown) {
    return value
  }
}
