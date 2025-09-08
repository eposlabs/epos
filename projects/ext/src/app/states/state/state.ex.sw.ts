import type { DbKey, DbName, DbStore } from '../../idb/idb.sw'
import type { MObj } from './state-node.ex.sw'

export type Location = [DbName, DbStore, DbKey]
export type Initial = () => Obj
export type Versioner = Record<number, (state: MObj) => void>
export type Root = MObj & { ':version'?: number }
export type Value = undefined | null | boolean | number | string | Value[] | { [key: string]: Value }

export type Options = {
  initial?: Initial
  versioner?: Versioner
  unitScope?: string
}

export class State extends $exSw.Unit {
  id: string
  root: Root | null = null
  doc = new this.$.libs.yjs.Doc()
  bus: $gl.BusApi
  location: Location
  initial: Initial | null
  versioner: Versioner | null
  unitScope: string

  idb = new $exSw.StateIdb(this)
  node = new $exSw.StateNode(this)
  observer = new $exSw.StateObserver(this)
  boot!: $exSw.StateBoot

  static async create(parent: $exSw.Unit, location: Location, options: Options) {
    const state = new $exSw.State(parent, location, options)
    await state.init()
    return state
  }

  constructor(parent: $exSw.Unit, location: Location, options: Options) {
    super(parent)
    this.id = location.join('/')
    this.bus = this.$.bus.create(`state[${this.id}]`)
    this.location = location
    this.initial = options.initial ?? null
    this.versioner = options.versioner ?? null
    this.unitScope = options.unitScope ?? ':default'
  }

  private async init() {
    this.boot = await $exSw.StateBoot.create(this)
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
