import type { Log } from '@eposlabs/utils'
import type { IObservableFactory } from 'mobx'

let $: $ex.App | $sw.App

export const _disposers_ = Symbol('disposers')
export const _observableKeys_ = Symbol('observableKeys')
export type ObservableUnit = Unit & { __observable: true }

export class Units extends $exSw.Unit {
  map: { [registry: string]: { [name: string]: typeof Unit } } = {}
  Unit = Unit

  static _disposers_ = _disposers_
  static _observableKeys_ = _observableKeys_

  constructor(parent: $exSw.Unit) {
    super(parent)
    $ ??= this.$
  }

  register(registry: string, Class: typeof Unit, aliases: string[] = []) {
    const names = [Class.name, ...aliases]
    const classes = this.map[registry] ?? {}
    for (const name of names) classes[name] = Class
  }

  createEmptyObservableUnit(registry: string, spec: string, keys: string[]) {
    // Create empty unit shape and construct MobX annotations
    const unit: Obj = {}
    const annotations: Record<string, IObservableFactory['ref']> = {}
    for (const key of keys) {
      unit[key] = undefined
      annotations[key] = this.$.libs.mobx.observable
    }

    // Make unit observable
    this.$.libs.mobx.makeObservable(unit, annotations, { deep: false })

    // Keep the list of observable keys
    Reflect.defineProperty(unit, _observableKeys_, { configurable: true, get: () => keys })

    // Apply prototype
    const Class = this.getClass(registry, spec)
    if (!Class) throw this.never
    Reflect.setPrototypeOf(unit, Class.prototype)

    return unit as unknown as ObservableUnit
  }

  getObservableKeys(unit: ObservableUnit) {
    return unit[_observableKeys_]
  }

  isObservableUnit(target: unknown): target is ObservableUnit {
    return target instanceof Unit && this.$.libs.mobx.isObservable(target)
  }

  setup(unit: ObservableUnit) {
    this.setupUi(unit)
    this.setupLog(unit)
    this.setupRoot(unit)
    this.setupName(unit)
    this.setupVersion(unit)
    if (this.$.is.function(unit.init)) unit.init()
  }

  cleanup(unit: ObservableUnit) {
    unit[_disposers_]?.forEach(disposer => disposer())
    if (this.$.is.function(unit.cleanup)) unit.cleanup()
  }

  isUnitSpec(registry: string, spec: unknown): spec is string {
    const classes = this.map[registry]
    if (!classes) return false
    if (!this.$.is.string(spec)) return false
    const name = this.getSpecName(spec)
    return name in classes
  }

  // ---------------------------------------------------------------------------
  // UNIT SETUP
  // ---------------------------------------------------------------------------

  private setupUi(unit: ObservableUnit) {
    if (!this.isEx()) return

    const Unit = this.getConstructor(unit)
    const keys = Object.getOwnPropertyNames(Unit.prototype)
    const uiKeys = keys.filter(key => this.isUiKey(key))

    for (const key of uiKeys) {
      const unit_ = unit as unknown as Obj
      if (!this.$.is.function(unit_[key])) continue
      const cmpName = key === 'ui' ? Unit.name : [Unit.name, key].join('-')
      unit_[key] = this.$.ui.component(cmpName, unit_[key].bind(unit_))
    }
  }

  private setupLog(unit: ObservableUnit) {
    const Unit = this.getConstructor(unit)
    const log = this.$.libs.createLog(Unit.name)
    Reflect.defineProperty(unit, 'log', { get: () => log })
  }

  private setupRoot(unit: ObservableUnit) {
    const root = this.getRoot(unit)
    Reflect.defineProperty(unit, '$', { get: () => root })
  }

  private setupName(unit: ObservableUnit) {
    const Unit = this.getConstructor(unit)
    if (this.name(unit) === Unit.name) return
    this.name(unit, Unit.name)
  }

  private setupVersion(unit: ObservableUnit) {
    const Unit = this.getConstructor(unit)

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

    // Update keys
    Reflect.defineProperty(unit, _observableKeys_, { configurable: true, get: () => keysAfter })
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  /** Unit name getter / setter. */
  private name(unit: ObservableUnit): string
  private name(unit: ObservableUnit, value: string): void
  private name(unit: ObservableUnit, value?: string) {
    if (this.$.is.undefined(value)) {
      return unit['@'].split(':')[0]
    } else {
      const version = this.version(unit)
      unit['@'] = this.$.is.number(version) ? `${value}:${version}` : value
    }
  }

  /** Unit version getter / setter. */
  private version(unit: ObservableUnit): number
  private version(unit: ObservableUnit, value: number): void
  private version(unit: ObservableUnit, value?: number) {
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

  private isFresh(unit: ObservableUnit) {
    return unit['@'].split(':').length === 1
  }

  private isUiKey(key: string) {
    return key === 'ui' || /^[A-Z][a-zA-Z0-9]*$/.test(key)
  }

  private getConstructor(unit: ObservableUnit) {
    return unit.constructor as typeof Unit
  }

  private getSpecName(spec: string) {
    return spec.split(':')[0]
  }

  private getClass(registry: string, spec: string) {
    const name = this.getSpecName(spec)
    if (!(registry in this.map)) return null
    const classes = this.map[registry]
    if (!(name in classes)) return null
    return classes[name]
  }

  private getRoot(unit: ObservableUnit): ObservableUnit | null {
    let root = unit
    let cursor: any = unit
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
  declare $: Obj | Unit
  declare log: Log
  declare init?: unknown
  declare cleanup?: unknown
  declare static v: Record<number, (this: Unit, unit: Unit) => void>;
  declare [_observableKeys_]: string[];
  declare [_disposers_]?: Fn[]

  up<T extends Unit>(Ancestor: Cls<T>): T | null {
    let cursor = $exSw.StateNode.getOwner(this as any)
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

// Required for TypeScript, otherwise it complains about symbols (_disposers_, _observableKeys_)
export { Unit }
