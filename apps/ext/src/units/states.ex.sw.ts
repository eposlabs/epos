import type { DbName, DbStoreName } from 'dropcap/idb'
import type { Initial, Root, Versioner } from './state.ex.sw'

export type Models = Record<string, Cls>
export type Config = { allowMissingModels?: boolean }

export class States extends exSw.Unit {
  id: string
  dict: Record<string, exSw.State> = {}
  dbName: DbName
  dbStoreName: DbStoreName
  config: Config
  models: Models = {}
  private bus: ReturnType<gl.Bus['for']>
  private queue = new this.$.utils.Queue()
  private autoDisconnectInterval = -1 // For `sw`
  private static instanceIds = new Set<string>()

  get list() {
    return Object.values(this.dict)
  }

  constructor(parent: exSw.Unit, dbName: DbName, dbStoreName: DbStoreName, config?: Config) {
    super(parent)

    this.id = `States[${dbName}/${dbStoreName}]`
    this.dbName = dbName
    this.dbStoreName = dbStoreName
    this.config = config ?? { allowMissingModels: false }
    this.bus = this.$.bus.for(`States[${dbName}/${dbStoreName}]`)
    this.connect = this.queue.wrap(this.connect, this)
    this.disconnect = this.queue.wrap(this.disconnect, this)

    // Do not allow multiple instances for the same db store
    if (States.instanceIds.has(this.id)) throw this.never()
    States.instanceIds.add(this.id)

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

  async connect<T>(name: string, initial?: Initial<T>, versioner?: Versioner<T>): Promise<Root<T>> {
    // Already connected? -> Return existing
    if (this.dict[name]) return this.dict[name].root as Root<T>

    // Ensure `sw` is connected first
    if (this.$.env.is.ex) await this.bus.send('swConnect', name)

    // Create and initialize state
    const state = new exSw.State(this, name, initial, versioner)
    await state.init()
    this.dict[name] = state as any

    return state.root
  }

  async disconnect(name: string) {
    // Not connected? -> Ignore
    const state = this.dict[name]
    if (!state) return

    // Disconnect and remove
    await state.disconnect()
    delete this.dict[name]
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

  create<T>(initial?: Initial<T>) {
    const state = new exSw.State(this, null, initial)
    return state.root
  }

  transaction(fn: () => void) {
    // Build transaction function over all states
    let transaction = () => fn()
    for (const state of this.list) {
      const previousTransaction = transaction
      transaction = () => state.transaction(() => previousTransaction())
    }

    // Each `state.transaction` is already wrapped in a MobX action,
    // but we still wrap to support non-state observables
    this.$.libs.mobx.runInAction(() => transaction())
  }

  register(models: Models) {
    Object.assign(this.models, models)
  }

  isConnected(name: string) {
    return name in this.dict
  }

  async dispose() {
    this.bus.off()
    clearInterval(this.autoDisconnectInterval)
    for (const name in this.dict) await this.disconnect(name)
    await this.$.idb.deleteStore(this.dbName, this.dbStoreName)
    States.instanceIds.delete(this.id)
  }

  /** Automatically disconnect `sw` state if there are no `ex` connections to it. */
  private setupAutoDisconnect() {
    if (!this.$.env.is.sw) return
    this.autoDisconnectInterval = setInterval(async () => {
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
