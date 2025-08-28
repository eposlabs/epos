import type { DbKey, DbName, DbStore } from '../../idb/idb.sw'
import type { MObj } from './state-node.ex.sw'

export type Location = [DbName, DbStore, DbKey]
export type Initial = () => Obj
export type Versioner = Record<number, (state: MObj) => void>
export type Root = MObj & { ':version'?: number }

/** Supported state values. */
export type Value = undefined | null | boolean | number | string | Value[] | { [key: string]: Value }

/**
 * #### How Sync Works
 * MobX → Local Yjs → (bus) → Remote Yjs → MobX
 */
export class State extends $exSw.Unit {
  id: string
  root: Root | null = null
  location: Location
  doc = new this.$.libs.yjs.Doc()
  bus: ReturnType<typeof this.$.bus.create>
  initial: Initial | null
  versioner: Versioner | null

  idb = new $exSw.StateIdb(this)
  node = new $exSw.StateNode(this)
  observer = new $exSw.StateObserver(this)
  setup = new $exSw.StateSetup(this)

  constructor(parent: $exSw.Unit, location: Location, initial?: Initial, versioner?: Versioner) {
    super(parent)
    this.id = location.join('/')
    this.bus = this.$.bus.create(`state[${this.id}]`)
    this.location = location
    this.initial = initial ?? null
    this.versioner = versioner ?? null
  }

  async init() {
    await this.setup.init()
  }

  async cleanup() {
    await this.setup.cleanup()
  }

  transaction(fn: () => void) {
    this.$.libs.mobx.runInAction(() => {
      this.doc.transact(() => {
        fn()
      })
    })
  }
}
