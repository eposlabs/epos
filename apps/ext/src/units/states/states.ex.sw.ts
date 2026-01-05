import type { DbName, DbStoreName } from 'dropcap/idb'
import type { Initial, ModelClass, Versioner } from './state.ex.sw'

export const _local_ = Symbol('local')
export const _exclude_ = Symbol('exclude')

export type Models = Record<string, ModelClass>
export type Config = { allowMissingModels?: boolean }

export class States extends exSw.Unit {
  map: Record<string, exSw.State> = {}
  dbName: DbName
  dbStoreName: DbStoreName
  config: Config
  models: Models = {}
  private bus: ReturnType<gl.Bus['create']>
  private queue = new this.$.utils.Queue()

  get list() {
    return Object.values(this.map)
  }

  constructor(parent: exSw.Unit, dbName: DbName, dbStoreName: DbStoreName, config?: Config) {
    super(parent)

    this.dbName = dbName
    this.dbStoreName = dbStoreName
    this.config = config ?? { allowMissingModels: false }
    this.bus = this.$.bus.create(`States[${dbName}/${dbStoreName}]`)
    this.connect = this.queue.wrap(this.connect, this)
    this.disconnect = this.queue.wrap(this.disconnect, this)

    // Setup `ex`
    if (this.$.env.is.ex) {
      this.bus.on('exDisconnect', this.disconnect, this)
    }

    // Setup `sw`
    else if (this.$.env.is.sw) {
      this.bus.on('swConnect', this.voidify(this.connect), this)
      this.bus.on('swRemove', this.remove, this)
      this.setupAutoDisconnect()
    }
  }

  async connect(name: string, initial?: Initial, versioner?: Versioner) {
    // Already connected? -> Return existing
    if (this.map[name]) return this.map[name]

    // Ensure `sw` is connected first
    if (this.$.env.is.ex) await this.bus.send('swConnect', name)

    // Create and initialize state
    const state = new exSw.State(this, name, initial, versioner)
    await state.init()
    this.map[name] = state

    return state
  }

  async disconnect(name: string) {
    // Not connected? -> Ignore
    const state = this.map[name]
    if (!state) return

    // Disconnect and remove
    await state.disconnect()
    delete this.map[name]
  }

  async dispose() {
    this.bus.dispose()
    for (const name in this.map) await this.disconnect(name)
    await this.$.idb.deleteStore(this.dbName, this.dbStoreName)
  }

  async remove(name: string) {
    if (this.$.env.is.ex) {
      await this.disconnect(name)
      await this.bus.send('swRemove', name)
    } else if (this.$.env.is.sw) {
      await this.disconnect(name)
      await this.bus.send('exDisconnect', name)
      await this.$.idb.delete(this.dbName, this.dbStoreName, name)
    }
  }

  transaction(fn: () => void) {
    // Build transact function over all states
    let transact = () => fn()
    for (const state of this.list) {
      const previousTransact = transact
      transact = () => state.transaction(() => previousTransact())
    }

    // Each `state.transaction` is already wrapped in a MobX action,
    // but we still wrap to support non-state observables.
    this.$.libs.mobx.runInAction(() => transact())
  }

  isConnected(name: string) {
    return name in this.map
  }

  register(models: Models) {
    Object.assign(this.models, models)
  }

  /** Automatically disconnect state if there are no `ex` connections to it. */
  private setupAutoDisconnect() {
    self.setInterval(async () => {
      for (const state of this.list) {
        const hasPeers = await state.hasPeers()
        if (!hasPeers) await this.disconnect(state.name)
      }
    }, this.$.utils.time('15s'))
  }

  private voidify<T extends Fn>(fn: T) {
    return async (...args: Parameters<T>) => {
      await fn.call(this, ...args)
    }
  }
}
