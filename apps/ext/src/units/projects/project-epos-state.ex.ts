import type { Initial, Versioner } from '../states/state.ex.sw'
import type { Models } from '../states/states.ex.sw'

const DEFAULT_STATE_NAME = ':default'

export class ProjectEposState extends ex.Unit {
  private $epos = this.closest(ex.ProjectEpos)!
  private $project = this.closest(ex.Project)!
  static DEFAULT_STATE_NAME = DEFAULT_STATE_NAME

  async connect(initial?: Initial, versioner?: Versioner): Promise<Obj>
  async connect(name: string, initial?: Initial, versioner?: Versioner): Promise<Obj>
  async connect(arg0?: unknown, arg1?: unknown, arg2?: unknown): Promise<Obj> {
    let nameArg: unknown
    let initialArg: unknown
    let versionerArg: unknown
    if (this.$.utils.is.string(arg0)) {
      nameArg = arg0
      initialArg = arg1 ?? {}
      versionerArg = arg2 ?? {}
    } else {
      nameArg = null
      initialArg = arg0 ?? {}
      versionerArg = arg1 ?? {}
    }

    const name = this.prepareName(nameArg, this.connect)
    const initial = this.prepareInitial(initialArg, this.connect)
    const versioner = this.prepareVersioner(versionerArg, this.connect)
    const state = await this.$project.states.connect(name, initial, versioner)
    return state.data
  }

  async disconnect(nameArg?: string) {
    const name = this.prepareName(nameArg, this.disconnect)
    await this.$project.states.disconnect(name)
  }

  transaction(fn: () => void) {
    this.$project.states.transaction(fn)
  }

  local<T extends Obj = {}>(dataArg = {} as T): T {
    const data = this.prepareLocalStateData(dataArg, this.local)
    return this.$.libs.mobx.observable(data) as T
  }

  async list(filter: { connected?: boolean } = {}) {
    const names = await this.$.idb.keys(this.$project.name, ':state')
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

  private prepareName(name: unknown, caller: Fn) {
    if (this.$.utils.is.absent(name)) return DEFAULT_STATE_NAME
    if (!this.$.utils.is.string(name)) throw this.$epos.error(`State name must be a string`, caller)
    if (name === '') throw this.$epos.error(`State name must be a non-empty string`, caller)
    if (name.length > 30) throw this.$epos.error(`State name is too long: '${name}'`, caller)

    const regex = /^[a-zA-Z0-9-_]+$/
    if (!regex.test(name)) {
      throw this.$epos.error(
        `Invalid state name: '${name}'; allowed chars: a-z, A-Z, 0-9, '-', and '_'`,
        caller,
      )
    }

    return name
  }

  private prepareInitial(initial: unknown, caller: Fn) {
    if (!this.$.utils.is.function(initial) && !this.$.utils.is.object(initial)) {
      throw this.$epos.error(`Invalid state must be an object or a function returning an object`, caller)
    }

    return initial as Initial
  }

  private prepareVersioner(versioner: unknown, caller: Fn) {
    if (!this.$.utils.is.object(versioner)) throw this.$epos.error(`Versioner must be an object`, caller)

    const keys = Object.keys(versioner)
    const nonNumericKey = keys.find(key => !this.$.utils.is.numeric(key))
    if (nonNumericKey) {
      throw this.$epos.error(`Invalid versioner: expected numeric keys, but found '${nonNumericKey}'`, caller)
    }

    const badValueKey = keys.find(key => !this.$.utils.is.function(versioner[key]))
    if (badValueKey) {
      throw this.$epos.error(
        `Invalid versioner: expected all values to be functions, but found an invalid value at key: '${badValueKey}'`,
        caller,
      )
    }

    return versioner as Versioner
  }

  private prepareLocalStateData(data: unknown, caller: Fn) {
    if (!this.$.utils.is.object(data)) throw this.$epos.error(`State must be an object`, caller)
    return data
  }
}
