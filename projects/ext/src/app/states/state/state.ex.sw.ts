import type { DbKey, DbName, DbStore } from '../../idb/idb.sw'
import type { MObj } from './state-node.ex.sw'

export type Location = [DbName, DbStore, DbKey]
export type Initial = () => Obj
export type Versioner = Record<number, (state: MObj) => void>
export type Root = MObj & { ':version'?: number }
export type Value = undefined | null | boolean | number | string | Value[] | { [key: string]: Value }

export type Opts = {
  scope?: string
  initial?: Initial
  versioner?: Versioner
}

export class State extends $exSw.Unit {
  id: string
  root: Root | null = null
  doc = new this.$.libs.yjs.Doc()
  bus: $gl.BusApi
  location: Location
  scope: string
  initial: Initial | null
  versioner: Versioner | null

  boot = new $exSw.StateBoot(this)
  idb = new $exSw.StateIdb(this)
  node = new $exSw.StateNode(this)
  observer = new $exSw.StateObserver(this)

  static async create(parent: $exSw.Unit, location: Location, opts: Opts) {
    const state = new $exSw.State(parent, location, opts)
    await state.boot.init()
    return state
  }

  constructor(parent: $exSw.Unit, location: Location, opts: Opts) {
    super(parent)
    this.id = location.join('/')
    this.bus = this.$.bus.create(`state[${this.id}]`)
    this.location = location
    this.scope = opts.scope ?? ':default'
    this.initial = opts.initial ?? null
    this.versioner = opts.versioner ?? null
  }

  async cleanup() {
    await this.boot.cleanup()
  }

  transaction(fn: () => void) {
    this.$.libs.mobx.runInAction(() => {
      this.doc.transact(() => {
        fn()
      })
    })
  }
}
