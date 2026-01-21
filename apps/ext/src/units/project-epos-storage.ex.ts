export const DEFAULT_NAME = ':storage'

export class ProjectEposStorage extends ex.Unit {
  private $project = this.closest(ex.Project)!
  static DEFAULT_NAME = DEFAULT_NAME

  async get<T>(key: string): Promise<T | null>
  async get<T>(name: string, key: string): Promise<T | null>
  async get<T>(...args: unknown[]) {
    const [name, key] = args.length === 1 ? [DEFAULT_NAME, args[0] as string] : [args[0] as string, args[1] as string]
    this.validateName(name)
    return await this.$.idb.get<T>(this.$project.id, name, key)
  }

  async set(key: string, value: string): Promise<void>
  async set(name: string, key: string, value: unknown): Promise<void>
  async set(...args: unknown[]) {
    const [name, key, value] =
      args.length === 2
        ? [DEFAULT_NAME, args[0] as string, args[1] as unknown]
        : [args[0] as string, args[1] as string, args[2] as unknown]
    this.validateName(name)
    await this.$.idb.set(this.$project.id, name, key, value)
  }

  async delete(key: string): Promise<void>
  async delete(name: string, key: string): Promise<void>
  async delete(...args: unknown[]) {
    const [name, key] = args.length === 1 ? [DEFAULT_NAME, args[0] as string] : [args[0] as string, args[1] as string]
    this.validateName(name)
    await this.$.idb.delete(this.$project.id, name, key)
  }

  async keys(name = DEFAULT_NAME) {
    this.validateName(name)
    return await this.$.idb.keys(this.$project.id, name)
  }

  async remove(name = DEFAULT_NAME) {
    this.validateName(name)
    return await this.$.idb.deleteStore(this.$project.id, name)
  }

  use(name: string = DEFAULT_NAME) {
    this.validateName(name)
    return {
      get: <T>(key: string) => this.get<T>(name, key),
      set: (key: string, value: unknown) => this.set(name, key, value),
      delete: (key: string) => this.delete(name, key),
      keys: () => this.keys(name),
      remove: () => this.remove(name),
    }
  }

  async list() {
    const names = await this.$.idb.listStores(this.$project.id)
    return names.filter(name => !name.startsWith(':') || name === DEFAULT_NAME)
  }

  private validateName(name: string) {
    if (name.startsWith(':') && name !== DEFAULT_NAME) {
      throw new Error(`Storage name cannot start with ':'`)
    }
  }
}
