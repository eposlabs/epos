import type { Log } from 'dropcap/utils'
import type { IObservableFactory } from 'mobx/dist/api/observable'
import type { MNode, MObj } from './state/state-node.ex.sw'
import { _keys_, _meta_ } from './state/state-node.ex.sw'

let $: $ex.App | $sw.App
const _disposers_ = Symbol('disposers')

export class StoreUnits extends $exSw.Unit {
  private $store = this.up($exSw.Store, 'internal')!
  map: { [name: string]: typeof Unit } = {}
  Unit = Unit

  constructor(parent: $exSw.Unit) {
    super(parent)
    $ = this.$
  }

  register(Class: typeof Unit, aliases: string[] = []) {
    const names = [Class.name, ...aliases]
    for (const name of names) {
      this.map[name] = Class
    }
  }

  setup(unit: Unit) {
    this.setupUi(unit)
    this.setupLog(unit)
    this.setupRaw(unit)
    this.setupRoot(unit)
    this.setupName(unit)
    this.setupVersion(unit)
    if (this.$.is.function(unit.init)) unit.init()
  }

  cleanup(unit: Unit) {
    unit[_disposers_]?.forEach(disposer => disposer())
    if (this.$.is.function(unit.cleanup)) unit.cleanup()
  }

  isUnit(target: unknown) {
    return target instanceof Unit
  }

  isUnitSpec(spec: unknown): spec is string {
    if (!this.$.is.string(spec)) return false
    const name = this.specToName(spec)
    return name in this.map
  }

  getClassBySpec(spec: string) {
    const name = this.specToName(spec)
    if (!(name in this.map)) return null
    return this.map[name]
  }

  getAnnotationKeys(unit: Unit) {
    const unit_ = unit as any
    return unit_[_keys_]
    // const _mobx_ = this.$.libs.mobx.$mobx
    // return Object.keys(unit_[_mobx_].appliedAnnotations_)
  }

  // ---------------------------------------------------------------------------
  // SETUP
  // ---------------------------------------------------------------------------

  private setupUi(unit: Unit) {
    if (!this.isEx()) return

    const Unit = this.getClass(unit)
    const keys = Object.getOwnPropertyNames(Unit.prototype)
    const uiKeys = keys.filter(key => this.isUiKey(key))

    for (const key of uiKeys) {
      const unit_ = unit as unknown as Obj
      if (!this.$.is.function(unit_[key])) continue
      const cmpName = key === 'ui' ? Unit.name : [Unit.name, key].join('-')
      unit_[key] = this.$.ui.component(cmpName, unit_[key].bind(unit_))
    }
  }

  private setupLog(unit: Unit) {
    const Unit = this.getClass(unit)
    const log = this.$.libs.createLog(Unit.name)
    Reflect.defineProperty(unit, 'log', { get: () => log })
  }

  private setupRaw(unit: Unit) {
    Reflect.defineProperty(unit, '__', { get: () => this.$store.utils.raw(unit) })
  }

  private setupRoot(unit: Unit) {
    const root = this.getRoot(unit)
    Reflect.defineProperty(unit, '$', {
      get: () => {
        // const s = this
        // const u = unit
        // debugger
        return root
      },
    })
  }

  private setupName(unit: Unit) {
    const Unit = this.getClass(unit)
    if (this.name(unit) === Unit.name) return
    this.name(unit, Unit.name)
  }

  private setupVersion(unit: Unit) {
    const Unit = this.getClass(unit)

    // Extract versions
    const versions = Object.keys(Unit.v || {})
      .map(Number)
      .filter(v => v >= 1)
      .sort((v1, v2) => v1 - v2)

    // Fresh unit? -> Set the latest version
    if (this.isFresh(unit)) {
      this.version(unit, versions.at(-1) ?? 0)
      return
    }

    // Check if versioning is required
    if (versions.length === 0) return
    const latest = versions.at(-1)!
    if (this.version(unit) >= latest) return

    // Get keys before versioning
    const keysBefore = new Set(Object.keys(unit))

    // Run versioning
    for (const version of versions) {
      if (this.version(unit) >= version) continue
      Unit.v[version].call(unit, unit)
      this.version(unit, version)
    }

    // Get keys after versioning
    const keysAfter = new Set(Object.keys(unit))

    // Cast unit to object for TypeScript
    const unit_ = unit as unknown as Obj

    // Notify MobX about removed keys
    for (const key of keysBefore) {
      if (keysAfter.has(key)) continue
      unit_[key] = null // required for MobX to pick up the change
      this.$.libs.mobx.remove(unit, key)
    }

    // Notify MobX about new keys
    for (const key of keysAfter) {
      if (keysBefore.has(key)) continue
      const value = unit_[key]
      delete unit_[key] // required for MobX to pick up the change
      this.$.libs.mobx.set(unit, key, value)
    }
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private name(unit: Unit): string
  private name(unit: Unit, value: string): void
  private name(unit: Unit, value?: string) {
    if (this.$.is.undefined(value)) {
      return unit['@'].split(':')[0]
    } else {
      const version = this.version(unit)
      unit['@'] = this.$.is.number(version) ? `${value}:${version}` : value
    }
  }

  private version(unit: Unit): number
  private version(unit: Unit, value: number): void
  private version(unit: Unit, value?: number) {
    if (this.$.is.undefined(value)) {
      const version = unit['@'].split(':')[1]
      return version ? Number(version) : 0
    } else {
      unit['@'] = `${this.name(unit)}:${value}`
    }
  }

  private isEx(): this is $ex.Unit {
    return this.$.env.is.ex
  }

  private isFresh(unit: Unit) {
    return unit['@'].split(':').length === 1
  }

  private isUiKey(key: string) {
    return key === 'ui' || /^[A-Z][a-zA-Z0-9]*$/.test(key)
  }

  private getClass(unit: Unit) {
    return unit.constructor as typeof Unit
  }

  private specToName(link: string) {
    return link.split(':')[0]
  }

  private getRoot(unit: Unit) {
    let root: Unit | MObj = unit
    let cursor: Unit | MNode | null = unit
    while (cursor) {
      if ('@' in cursor) root = cursor
      cursor = $exSw.StateNode.getOwner(cursor)
    }

    return root
  }
}

// ---------------------------------------------------------------------------
// UNIT
// ---------------------------------------------------------------------------

class Unit {
  '@' = this.constructor.name
  declare $: Unit | MObj
  declare __?: unknown
  declare log: Log
  declare init?: unknown
  declare cleanup?: unknown
  declare static v: Record<number, (this: Unit, unit: Unit) => void>;
  declare [_disposers_]?: Fn[]

  up<T extends Unit>(Ancestor: Cls<T>): T | null {
    let cursor = $exSw.StateNode.getOwner(this)
    while (cursor) {
      if (cursor instanceof Ancestor) return cursor
      cursor = $exSw.StateNode.getOwner(cursor)
    }
    return null
  }

  autorun(...args: Parameters<typeof $.libs.mobx.autorun>) {
    const disposer = $.libs.mobx.autorun(...args)
    this[_disposers_] ??= []
    this[_disposers_].push(disposer)
    return disposer
  }

  reaction(...args: Parameters<typeof $.libs.mobx.reaction>) {
    const disposer = $.libs.mobx.reaction(...args)
    this[_disposers_] ??= []
    this[_disposers_].push(disposer)
    return disposer
  }

  setTimeout(...args: Parameters<typeof self.setTimeout>) {
    const id = self.setTimeout(...args)
    this[_disposers_] ??= []
    this[_disposers_].push(() => self.clearTimeout(id))
    return id
  }

  setInterval(...args: Parameters<typeof self.setInterval>) {
    const id = self.setInterval(...args)
    this[_disposers_] ??= []
    this[_disposers_].push(() => self.clearInterval(id))
    return id
  }
}

export { Unit }
