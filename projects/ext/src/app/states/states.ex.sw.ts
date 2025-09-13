import type { Location, Options } from './state/state.ex.sw'
import { _keys_ } from './state/state-node.ex.sw'

export const _local_ = Symbol('local')
export const _exclude_ = Symbol('exclude')

export class States extends $exSw.Unit {
  map: Record<string, $exSw.State> = {}
  local = new $exSw.StatesLocal(this)
  private queue = new this.$.utils.Queue()
  units = {}

  get list() {
    return Object.values(this.map)
  }

  constructor(parent: $exSw.Unit) {
    super(parent)

    this.connect = this.queue.wrap(this.connect, this)
    this.disconnect = this.queue.wrap(this.disconnect, this)

    if (this.$.env.is.ex) {
      this.$.bus.on('states.exDisconnect', this.disconnect, this)
    } else if (this.$.env.is.sw) {
      this.$.bus.on('states.swConnect', this.voidify(this.connect))
      this.$.bus.on('states.swDestroy', this.destroy, this)
      this.initAutoDisconnect()
    }
  }

  deleteKey(obj: Obj, key: string) {
    delete obj[key]
    this.$.libs.mobx.remove(obj, key)
    if (obj[_keys_]) {
      const index = obj[_keys_].indexOf(key)
      if (index !== -1) obj[_keys_].splice(index, 1)
    }
  }

  // epos.bus.on
  // epos.bus.send()
  // epos.bus.send()
  // epos.off()
  // epos.element
  // epos.render()
  // epos.component()
  // epos.react.portal
  // epos.react.render
  // epos.react.useReaction
  // epos.state.connect()
  // epos.state.disconnect()
  // epos.state.destroy()
  // epos.state.local()

  // epos.fetch
  // epos.browser
  // epos.autorun
  // epos.reaction
  // epos.state.local()
  // epos.state.exclude()
  // epos.state.addKey()
  // epos.state.removeKey()

  // epos.storage.set()
  // epos.storage.get()
  // epos.storage.delete()
  // epos.storage.keys()
  // epos.storage.clear()
  // epos.storage.list()
  // epos.Unit
  // epos.units.register({ App: App })
  // epos.units.list()
  // epos.assets.url()
  // epos.assets.blob()
  // epos.assets.load()
  // epos.transaction(() => {})

  addKey(obj: Obj, key: string, value: unknown) {
    this.$.libs.mobx.set(obj, key, value)
    if (obj[_keys_]) {
      if (!obj[_keys_].includes(key)) obj[_keys_].push(key)
    }
  }

  createLocal(obj = {}) {
    const localState = this.$.libs.mobx.observable(obj)
    localState[_local_] = true
    return localState
  }

  createExclude(value) {
    const excludeState = Object(value)
    excludeState[_exclude_] = true
    return excludeState
  }

  register(keyClassMap) {
    for (const key in keyClassMap) {
      this.units[key] = keyClassMap[key]
    }
  }

  async connect(location: Location, options: Options = {}) {
    // Already connected? -> Return connected state
    const id = location.join('/')
    if (this.map[id]) return this.map[id].root!

    // Ensure [sw] is connected first
    if (this.$.env.is.ex) {
      await this.$.bus.send('states.swConnect', location)
    }

    // Connect state
    const state = new $exSw.State(this, location, options)
    await state.connect()
    this.map[id] = state

    // Mark [ex] as connected
    if (this.$.env.is.ex) {
      this.$.bus.on(`states.exConnected[${id}]`, () => true)
    }

    return state.root!
  }

  async disconnect(location: Location) {
    // Not connected? -> Ignore
    const id = location.join('/')
    const state = this.map[id]
    if (!state) return

    // Disconnect and remove
    await state.disconnect()
    delete this.map[id]

    // Unmark [ex] as connected
    if (this.$.env.is.ex) {
      this.$.bus.off(`states.exConnected[${id}]`)
    }
  }

  async destroy(location: Location) {
    if (this.$.env.is.ex) {
      await this.disconnect(location)
      await this.$.bus.send('states.swDestroy', location)
    } else if (this.$.env.is.sw) {
      await this.disconnect(location)
      await this.$.bus.send('states.exDisconnect', location)
      await this.$.idb.delete(...location)
    }
  }

  transaction(fn: () => void) {
    // Build transact function over all states
    let transact = () => fn()
    for (const state of this.list) {
      const previous = transact
      transact = () => state.transaction(() => previous())
    }

    // Each 'state.transaction' is already wrapped in MobX action,
    // yet we wrap here again to support non-state observables.
    this.$.libs.mobx.runInAction(() => transact())
  }

  isConnected(location: Location) {
    const id = location.join('/')
    return id in this.map
  }

  /** Automatically disconnect state if there are no [ex] connections to it. */
  private initAutoDisconnect() {
    self.setInterval(async () => {
      for (const state of this.list) {
        const exConnected = await this.$.bus.send(`states.exConnected[${state.id}]`)
        if (exConnected) continue
        await this.disconnect(state.location)
      }
    }, this.$.utils.time('15s'))
  }

  private voidify<T extends Fn>(fn: T) {
    return async (...args: Parameters<T>) => {
      await fn.call(this, ...args)
    }
  }
}
