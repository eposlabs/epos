import { createLog, type Cls } from '@eposlabs/utils'
import { epos } from 'epos'

import type { FC } from 'react'

export const _root_ = Symbol('root')
export const _parent_ = Symbol('parent')
export const _disposers_ = Symbol('disposers')

export class Unit<TRoot = unknown> {
  declare '@': string
  declare private [_root_]: TRoot
  declare private [_parent_]: Unit<TRoot> | null // Parent reference for not-yet-attached units
  declare private [_disposers_]: Set<() => void>;
  [key: PropertyKey]: unknown

  constructor(parent: Unit<TRoot> | null = null) {
    Reflect.defineProperty(this, _parent_, { get: () => parent })
  }

  // ---------------------------------------------------------------------------
  // INIT
  // ---------------------------------------------------------------------------

  [epos.store.symbols.model.init]() {
    const Unit = this.constructor
    const prototypeKeys = Object.getOwnPropertyNames(Unit.prototype)

    // Set disposers container
    const disposers = new Set<() => void>()
    Reflect.defineProperty(this, _disposers_, { get: () => disposers })

    // Bind all methods
    for (const key of prototypeKeys) {
      if (typeof this[key] !== 'function') continue
      if (key === 'constructor') continue
      this[key] = this[key].bind(this)
    }

    // Wrap UI methods to components
    for (const key of prototypeKeys) {
      if (typeof this[key] !== 'function') continue
      if (!isUiKey(key)) continue
      const componentName = key === 'ui' ? this['@'] : [this['@'], key].join('-')
      this[key] = epos.component(componentName, this[key] as FC)
    }

    // Define log method
    const log = createLog(this['@'])
    Reflect.defineProperty(this, 'log', { get: () => log })

    // Call init method
    if (typeof this.init === 'function') this.init()
  }

  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------

  [epos.store.symbols.model.cleanup]() {
    // Call disposers
    this[_disposers_].forEach(disposer => disposer())
    this[_disposers_].clear()

    // Call cleanup method
    if (typeof this.cleanup === 'function') this.cleanup()
  }

  // ---------------------------------------------------------------------------
  // VERSIONER
  // ---------------------------------------------------------------------------

  static get [epos.store.symbols.model.versioner]() {
    if (!('versioner' in this)) return null
    return this.versioner
  }

  static defineVersioner(versioner: Record<number, (this: any, unit: any) => void>) {
    return versioner
  }

  // ---------------------------------------------------------------------------
  // GETTERS & METHODS
  // ---------------------------------------------------------------------------

  get $() {
    this[_root_] ??= findRoot(this) as TRoot
    return this[_root_]
  }

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

function isUiKey(key: string) {
  return key === 'ui' || /^[A-Z][a-zA-Z0-9]*$/.test(key)
}

function getParent(child: any) {
  return child[_parent_] ?? child[epos.store.symbols.model.parent]
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
