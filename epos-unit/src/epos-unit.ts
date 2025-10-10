import 'epos'
import { createLog, type Cls, type Log } from '@eposlabs/utils'
import type { FC } from 'react'

export const _root_ = Symbol('root')
export const _parent_ = Symbol('parent')
export const _disposers_ = Symbol('disposers')
export type Descriptors = Record<string | symbol, PropertyDescriptor>

export class Unit<TRoot = unknown> {
  declare '@': string
  declare log: Log;
  declare [':version']?: number
  declare private [_root_]: TRoot
  declare private [_parent_]: Unit<TRoot> | null // Parent reference for not-yet-attached units
  declare private [_disposers_]: Set<() => void>

  static get [epos.state.symbols.modelStrict]() {
    return true
  }

  constructor(parent: Unit<TRoot> | null) {
    // Define parent for not-yet-attached units
    Reflect.defineProperty(this, _parent_, { get: () => parent })
  }

  // ---------------------------------------------------------------------------
  // INIT
  // ---------------------------------------------------------------------------

  [epos.state.symbols.modelInit]() {
    const _this = this as any
    const Unit = this.constructor
    const descriptors: Descriptors = Object.getOwnPropertyDescriptors(Unit.prototype)
    const keys = Reflect.ownKeys(descriptors)

    // Setup disposers container
    const disposers = new Set<() => void>()
    Reflect.defineProperty(this, _disposers_, { get: () => disposers })

    // Bind all methods
    for (const key of keys) {
      if (key === 'constructor') continue
      const descriptor = descriptors[key]
      if (descriptor.get || descriptor.set) continue
      if (typeof descriptor.value !== 'function') continue
      _this[key] = descriptor.value.bind(this)
    }

    // Wrap UI methods to components
    for (const key of keys) {
      if (typeof key === 'symbol') continue
      if (!key.startsWith('ui')) continue
      const descriptor = descriptors[key]
      if (descriptor.get || descriptor.set) continue
      if (typeof _this[key] !== 'function') continue
      const componentName = [this['@'], key.replace('ui', '')].filter(Boolean).join('-')
      _this[key] = epos.component(componentName, _this[key] as FC)
    }

    // Define log method
    const log = createLog(this['@'])
    Reflect.defineProperty(this, 'log', { get: () => log })

    // Call init method
    if (typeof _this.init === 'function') _this.init()
  }

  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------

  [epos.state.symbols.modelCleanup]() {
    const _this = this as any

    // Call disposers
    this[_disposers_].forEach(disposer => disposer())
    this[_disposers_].clear()

    // Call cleanup method
    if (typeof _this.cleanup === 'function') _this.cleanup()
  }

  // ---------------------------------------------------------------------------
  // VERSIONER
  // ---------------------------------------------------------------------------

  static get [epos.state.symbols.modelVersioner]() {
    if (!('versioner' in this)) return null
    return this.versioner
  }

  static defineVersioner(versioner: Record<number, (this: any, unit: any) => void>) {
    return versioner
  }

  // ---------------------------------------------------------------------------
  // ROOT
  // ---------------------------------------------------------------------------

  get $() {
    this[_root_] ??= findRoot(this) as TRoot
    return this[_root_]
  }

  // ---------------------------------------------------------------------------
  // METHODS
  // ---------------------------------------------------------------------------

  up<T extends Unit>(Ancestor: Cls<T>): T | null {
    let cursor: unknown = getParent(this)
    while (cursor) {
      if (cursor instanceof Ancestor) return cursor
      cursor = getParent(cursor)
    }
    return null
  }

  autorun(...args: Parameters<typeof epos.libs.mobx.autorun>) {
    const disposer = epos.libs.mobx.autorun(...args)
    this[_disposers_].add(disposer)
    return disposer
  }

  reaction(...args: Parameters<typeof epos.libs.mobx.reaction>) {
    const disposer = epos.libs.mobx.reaction(...args)
    this[_disposers_].add(disposer)
    return disposer
  }

  setTimeout(...args: Parameters<typeof self.setTimeout>) {
    const id = self.setTimeout(...args)
    this[_disposers_].add(() => self.clearTimeout(id))
    return id
  }

  setInterval(...args: Parameters<typeof self.setInterval>) {
    const id = self.setInterval(...args)
    this[_disposers_].add(() => self.clearInterval(id))
    return id
  }
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function getParent(child: any) {
  return child[_parent_] ?? child[epos.state.symbols.parent]
}

function findRoot(unit: Unit) {
  let root = unit
  let cursor: any = unit

  while (cursor) {
    if (cursor instanceof Unit) root = cursor
    cursor = getParent(cursor)
  }

  return root
}
