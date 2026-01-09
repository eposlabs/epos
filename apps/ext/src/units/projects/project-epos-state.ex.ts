import type { Initial, Root, Versioner } from '../states/state.ex.sw'
import type { Models } from '../states/states.ex.sw'

const DEFAULT_STATE_NAME = ':default'

export class ProjectEposState extends ex.Unit {
  private $epos = this.closest(ex.ProjectEpos)!
  private $project = this.closest(ex.Project)!
  static DEFAULT_STATE_NAME = DEFAULT_STATE_NAME

  PARENT = exSw.State._parent_
  ATTACH = exSw.State._attach_
  DETACH = exSw.State._detach_

  async connect<T>(initial?: Initial<T>, versioner?: Versioner<T>): Promise<Root<T>>
  async connect<T>(name: string, initial?: Initial<T>, versioner?: Versioner<T>): Promise<Root<T>>
  async connect<T>(...args: [Initial<T>?, Versioner<T>?] | [string, Initial<T>?, Versioner<T>?]) {
    const [nameArg, initialArg, versionerArg] = this.$.utils.is.string(args[0]) ? args : [null, ...args]
    const name = this.prepareName(nameArg, this.connect)
    const initial = this.prepareInitial<T>(initialArg, this.connect)
    const versioner = this.prepareVersioner<T>(versionerArg, this.connect)
    return await this.$project.states.connect(name, initial as any, versioner)
  }

  async disconnect(nameArg?: string) {
    const name = this.prepareName(nameArg, this.disconnect)
    await this.$project.states.disconnect(name)
  }

  transaction(fn: () => void) {
    this.$project.states.transaction(fn)
  }

  create<T>(initialArg?: Initial<T>) {
    const state = this.prepareInitial<T>(initialArg, this.create)
    return this.$project.states.create(state)
  }

  async list(filter: { connected?: boolean } = {}) {
    const names = await this.$.idb.keys(this.$project.id, ':states')
    return names
      .map(name => ({
        name: name === DEFAULT_STATE_NAME ? null : name,
        connected: this.$project.states.isConnected(name),
      }))
      .filter(state => {
        if (this.$.utils.is.undefined(filter.connected)) return true
        return filter.connected === state.connected
      })
  }

  async remove(nameArg?: string) {
    const name = this.prepareName(nameArg, this.remove)
    await this.$project.states.remove(name)
  }

  register(models: Models) {
    this.$project.states.register(models)
  }

  private prepareName(name: unknown, caller: Fn): string {
    if (this.$.utils.is.absent(name)) return DEFAULT_STATE_NAME
    if (!this.$.utils.is.string(name)) throw this.$epos.error(`State name must be a string`, caller)
    if (name === '') throw this.$epos.error(`State name must be a non-empty string`, caller)
    if (name.length > 30) throw this.$epos.error(`State name is too long: '${name}'`, caller)

    const regex = /^[a-zA-Z0-9-_]+$/
    if (!regex.test(name)) {
      throw this.$epos.error(
        `Invalid state name: '${name}'. Allowed chars: a-z, A-Z, 0-9, '-', and '_'.`,
        caller,
      )
    }

    return name
  }

  private prepareInitial<T>(initial: unknown, caller: Fn): Initial<T> {
    if (this.$.utils.is.absent(initial)) return {} as Initial<T>
    if (!this.$.utils.is.object(initial)) throw this.$epos.error(`Initial state must be an object`, caller)
    return initial as Initial<T>
  }

  private prepareVersioner<T>(versioner: unknown, caller: Fn): Versioner<T> {
    if (!this.$.utils.is.object(versioner)) throw this.$epos.error(`Versioner must be an object`, caller)
    return versioner as Versioner<T>
  }
}
