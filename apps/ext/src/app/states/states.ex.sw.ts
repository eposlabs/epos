import type { Location, Options } from './state/state.ex.sw'

export const _local_ = Symbol('local')
export const _exclude_ = Symbol('exclude')

export class States extends exSw.Unit {
  map: Record<string, exSw.State> = {}
  private queue = new this.$.utils.Queue()
  private persistentIds = new Set<string>() // For [sw] only

  get list() {
    return Object.values(this.map)
  }

  constructor(parent: exSw.Unit) {
    super(parent)

    this.connect = this.queue.wrap(this.connect, this)
    this.disconnect = this.queue.wrap(this.disconnect, this)

    if (this.$.env.is.ex) {
      this.$.bus.on('states.exDisconnect', this.disconnect, this)
    } else if (this.$.env.is.sw) {
      this.$.bus.on('states.swConnect', async (location: Location, options: Options = {}) => {
        await this.connect(location, options, true)
      })
      this.$.bus.on('states.swRemove', this.remove, this)
      this.setupAutoDisconnect()
    }
  }

  async connect(location: Location, options: Options = {}, temp = false) {
    const id = location.join('/')
    if (this.$.env.is.sw && !temp) this.persistentIds.add(id)
    if (this.map[id]) return this.map[id]

    // Ensure [sw] is connected first
    if (this.$.env.is.ex) await this.$.bus.send('states.swConnect', location)

    // Create state
    const state = await exSw.State.init(this, location, options)
    this.map[id] = state

    // Mark [ex] as connected
    if (this.$.env.is.ex) this.$.bus.on(`states.exConnected[${id}]`, () => true)

    return state
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
    if (this.$.env.is.ex) this.$.bus.off(`states.exConnected[${id}]`)
  }

  async remove(location: Location) {
    // TODO: rework, use state.destroy()
    if (this.$.env.is.ex) {
      await this.disconnect(location)
      await this.$.bus.send('states.swRemove', location)
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
    // but we wrap here again to support non-state observables.
    this.$.libs.mobx.runInAction(() => transact())
  }

  isConnected(location: Location) {
    const id = location.join('/')
    return id in this.map
  }

  /** Automatically disconnect state if there are no [ex] connections to it. */
  private setupAutoDisconnect() {
    self.setInterval(async () => {
      for (const state of this.list) {
        const connected = await this.$.bus.send(`states.exConnected[${state.id}]`)
        if (connected) continue
        // console.warn('DISCONNECT', state.id)
        // await this.disconnect(state.location)
      }
    }, this.$.utils.time('15s'))
  }

  // private voidify<T extends Fn>(fn: T) {
  //   return async (...args: Parameters<T>) => {
  //     await fn.call(this, ...args)
  //   }
  // }

  // deleteKey(obj: Obj, key: string) {
  //   delete obj[key]
  //   this.$.libs.mobx.remove(obj, key)
  //   if (obj[_syncKeys_]) {
  //     const index = obj[_syncKeys_].indexOf(key)
  //     if (index !== -1) obj[_syncKeys_].splice(index, 1)
  //   }
  // }

  // addKey(obj: Obj, key: string, value: unknown) {
  //   this.$.libs.mobx.set(obj, key, value)
  //   if (obj[_syncKeys_]) {
  //     if (!obj[_syncKeys_].includes(key)) obj[_syncKeys_].push(key)
  //   }
  // }

  // createLocal(obj = {}) {
  //   const localState = this.$.libs.mobx.observable(obj)
  //   localState[_isNonSyncable_] = true
  //   return localState
  // }

  // createExclude(value) {
  //   const excludeState = Object(value)
  //   excludeState[_isNonSyncable_] = true
  //   return excludeState
  // }
}
