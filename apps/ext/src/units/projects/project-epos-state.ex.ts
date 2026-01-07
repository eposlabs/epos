import type { ObjArrModel, ObjModel } from 'epos'
import type { Initial, Versioner } from '../states/state.ex.sw'
import type { Models } from '../states/states.ex.sw'

const DEFAULT_STATE_NAME = ':default'

export class ProjectEposState extends ex.Unit {
  private $epos = this.closest(ex.ProjectEpos)!
  private $project = this.closest(ex.Project)!
  static DEFAULT_STATE_NAME = DEFAULT_STATE_NAME

  PARENT = exSw.State._parent_
  ATTACH = exSw.State._attach_
  DETACH = exSw.State._detach_

  async connect<T = Obj>(initial?: Initial<ObjModel<T>>, versioner?: Versioner<T>): Promise<T>
  async connect<T = Obj>(name?: string, initial?: Initial<ObjModel<T>>, versioner?: Versioner<T>): Promise<T>
  async connect<T = Obj>(arg0?: unknown, arg1?: unknown, arg2?: unknown) {
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
    const initial = this.prepareInitial<T>(initialArg, this.connect)
    const versioner = this.prepareVersioner<T>(versionerArg, this.connect)

    return await this.$project.states.connect(name, initial, versioner)
  }

  async disconnect(nameArg?: string) {
    const name = this.prepareName(nameArg, this.disconnect)
    await this.$project.states.disconnect(name)
  }

  transaction(fn: () => void) {
    this.$project.states.transaction(fn)
  }

  local<T = Obj>(stateArg?: ObjArrModel<T>): T {
    const state = this.prepareLocalState<T>(stateArg, this.local)
    return this.$project.states.local(state)
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

  private prepareName(name: unknown, caller: Fn) {
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

  private prepareInitial<T>(initial: unknown, caller: Fn): Initial<ObjModel<T>> {
    if (this.$.utils.is.absent(initial)) return {} as Initial<ObjModel<T>>

    const ok = this.$.utils.is.object(initial) || this.$.utils.is.function(initial)
    if (!ok) {
      throw this.$epos.error(`Initial state must be an object or a function returning an object`, caller)
    }

    return initial as Initial<ObjModel<T>>
  }

  private prepareVersioner<T>(versioner: unknown, caller: Fn) {
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

    return versioner as Versioner<T>
  }

  private prepareLocalState<T>(state: unknown, caller: Fn): ObjArrModel<T> {
    if (this.$.utils.is.absent(state)) return {} as ObjArrModel<T>

    const ok = this.$.utils.is.object(state) || this.$.utils.is.array(state)
    if (!ok) throw this.$epos.error('Local state must be an object or an array', caller)

    return state as ObjArrModel<T>
  }
}
