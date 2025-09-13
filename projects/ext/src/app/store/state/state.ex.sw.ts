import type { DbKey, DbName, DbStore } from '../../idb/idb.sw'
import type { MObj } from './state-node.ex.sw'

export type Root = MObj & { ':version'?: number }
export type Location = [DbName, DbStore, DbKey]
export type GetInitialState = () => Obj
export type Versioner = Record<number, (state: MObj) => void>
export type Schema = new (...args: unknown[]) => unknown

export type Options = {
  getInitialState?: GetInitialState
  schemas?: Record<string, Schema>
  versioner?: Versioner
}

/**
 * #### How Sync Works
 * MobX → Local Yjs → (bus) → Remote Yjs → MobX
 */
export class State extends $exSw.Unit {
  id: string
  data!: Root
  doc = new this.$.libs.yjs.Doc()
  bus: ReturnType<$gl.Bus['create']>
  location: Location
  schemas: Record<string, Schema>
  versioner: Versioner
  getInitialState: GetInitialState

  node = new $exSw.StateNode(this)
  observer = new $exSw.StateObserver(this)
  initializer = new $exSw.StateInitializer(this)
  persistence = new $exSw.StatePersistence(this)

  static async create(parent: $exSw.Unit, location: Location, options: Options = {}) {
    const state = new State(parent, location, options)
    await state.initializer.init()
    return state
  }

  async cleanup() {
    await this.initializer.stop()
    await this.persistence.save(true)
    this.doc.destroy()
  }

  constructor(parent: $exSw.Unit, location: Location, options: Options = {}) {
    super(parent)
    this.id = location.join('/')
    this.bus = this.$.bus.create(`state[${this.id}]`)
    this.location = location
    this.schemas = options.schemas ?? {}
    this.versioner = options.versioner ?? {}
    this.getInitialState = options.getInitialState ?? (() => ({}))
  }

  register(schemas: Record<string, Schema>) {
    Object.assign(this.schemas, schemas)
  }

  transaction(fn: () => void) {
    this.$.libs.mobx.runInAction(() => {
      this.doc.transact(() => {
        fn()
      })
    })
  }
}
