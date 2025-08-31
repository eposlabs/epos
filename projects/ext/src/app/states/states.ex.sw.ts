import type { Initial, Location, Versioner } from './state/state.ex.sw'

export class States extends $exSw.Unit {
  map: Record<string, $exSw.State> = {}
  local = new $exSw.StatesLocal(this)
  private queue = new this.$.utils.Queue()

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

  async connect(location: Location, initial?: Initial, versioner?: Versioner) {
    // Already connected? -> Return connected state
    const id = location.join('/')
    if (this.map[id]) return this.map[id].root

    // Ensure SW is connected first
    if (this.$.env.is.ex) {
      await this.$.bus.send('states.swConnect', location)
    }

    // Connect state
    const state = await $exSw.State.create(this, location, initial, versioner)
    this.map[id] = state

    // Mark EX as connected
    if (this.$.env.is.ex) {
      this.$.bus.on(`states.exConnected[${id}]`, () => true)
    }

    return state.root
  }

  async disconnect(location: Location) {
    // Not connected? -> Ignore
    const id = location.join('/')
    const state = this.map[id]
    if (!state) return

    // Cleanup and remove
    await state.cleanup()
    delete this.map[id]

    // Unmark EX as connected
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

    // Each 'state.transaction' is alreadys wrapped in MobX action,
    // yet we wrap here again to support non-state observables.
    this.$.libs.mobx.runInAction(() => transact())
  }

  has(location: Location) {
    const id = location.join('/')
    return id in this.map
  }

  /** Automatically disconnect state if there are no EX connections to it. */
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
