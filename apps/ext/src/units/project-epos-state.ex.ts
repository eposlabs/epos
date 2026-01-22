import type { Initial, Root, Versioner } from './state.ex.sw'
import type { Models } from './states.ex.sw'

export const DEFAULT_NAME = ':default'

export class ProjectEposState extends ex.Unit {
  private $project = this.closest(ex.Project)!
  static DEFAULT_NAME = DEFAULT_NAME

  PARENT = exSw.State._parent_
  ATTACH = exSw.State._attach_
  DETACH = exSw.State._detach_

  async connect<T>(initial?: Initial<T>, versioner?: Versioner<T>): Promise<Root<T>>
  async connect<T>(name: string, initial?: Initial<T>, versioner?: Versioner<T>): Promise<Root<T>>
  async connect<T>(...args: unknown[]) {
    const [name, initial, versioner] = this.$.utils.is.string(args[0])
      ? [args[0], args[1] as Initial<T> | undefined, args[2] as Versioner<T> | undefined]
      : [DEFAULT_NAME, args[0] as Initial<T> | undefined, args[1] as Versioner<T> | undefined]
    this.validateName(name)
    return await this.$project.states.connect(name, initial, versioner)
  }

  async disconnect(name: string = DEFAULT_NAME) {
    this.validateName(name)
    await this.$project.states.disconnect(name)
  }

  transaction(fn: () => void) {
    this.$project.states.transaction(fn)
  }

  create<T>(initial?: Initial<T>) {
    return this.$project.states.create(initial)
  }

  async list(filter: { connected?: boolean } = {}) {
    const names = await this.$.idb.keys(this.$project.id, ':state')
    return names
      .map(name => ({
        name: name === DEFAULT_NAME ? null : name,
        connected: this.$project.states.isConnected(name),
      }))
      .filter(state => {
        if (this.$.utils.is.undefined(filter.connected)) return true
        return filter.connected === state.connected
      })
  }

  async remove(name: string = DEFAULT_NAME) {
    this.validateName(name)
    await this.$project.states.remove(name)
  }

  register(models: Models) {
    this.$project.states.register(models)
  }

  private validateName(name: string) {
    if (name.startsWith(':') && name !== DEFAULT_NAME) {
      throw new Error(`State name cannot start with ':'`)
    }
  }
}
