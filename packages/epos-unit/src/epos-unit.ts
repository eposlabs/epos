import type { Cls } from 'dropcap/types'
import { createLog, Log } from 'dropcap/utils'
import 'epos'
import { nanoid } from 'nanoid'
import type { FC } from 'react'

export const _root_ = Symbol('root')
export const _parent_ = Symbol('parent')
export const _disposers_ = Symbol('disposers')
export type Descriptors = Record<string | symbol, PropertyDescriptor>

export class Unit<TRoot = unknown> {
  id = nanoid()
  declare '@': string
  declare log: Log;
  declare [':version']?: number
  declare private [_root_]: TRoot
  declare private [_parent_]: Unit<TRoot> | null // Parent reference for a not-yet-attached unit
  declare private [_disposers_]: Set<() => void>
  declare private init$: PromiseWithResolvers<void>

  static get [epos.symbols.stateModelStrict]() {
    return true
  }

  constructor(parent: Unit<TRoot> | null) {
    // Define parent for not-yet-attached units
    Reflect.defineProperty(this, _parent_, { get: () => parent })
  }

  // ---------------------------------------------------------------------------
  // INIT
  // ---------------------------------------------------------------------------

  async [epos.symbols.stateModelInit]() {
    const _this = this as any
    const Unit = this.constructor
    const descriptors: Descriptors = Object.getOwnPropertyDescriptors(Unit.prototype)
    const keys = Reflect.ownKeys(descriptors)
    this.init$ = Promise.withResolvers<void>()

    // Setup disposers container
    const disposers = new Set<() => void>()
    Reflect.defineProperty(this, _disposers_, { get: () => disposers })

    // Bind all methods
    for (const key of keys) {
      if (key === 'constructor') continue
      const descriptor = descriptors[key]
      if (!descriptor) continue
      if (descriptor.get || descriptor.set) continue
      if (typeof descriptor.value !== 'function') continue
      _this[key] = descriptor.value.bind(this)
    }

    // Create components out of `View` methods
    for (const key of keys) {
      if (typeof key === 'symbol') continue
      if (!key.endsWith('View')) continue
      const descriptor = descriptors[key]
      if (!descriptor) continue
      if (descriptor.get || descriptor.set) continue
      if (typeof _this[key] !== 'function') continue
      _this[key] = epos.component(_this[key] as FC)
      _this[key].displayName = `${this['@']}.${key}`
    }

    // Define log method
    const log = createLog(this['@'])
    Reflect.defineProperty(this, 'log', { get: () => log })

    // Call init method
    if (typeof _this.init === 'function') await _this.init()
    this.init$.resolve()
  }

  async waitInit() {
    await this.init$.promise
  }

  // ---------------------------------------------------------------------------
  // DISPOSE
  // ---------------------------------------------------------------------------

  [epos.symbols.stateModelDispose]() {
    const _this = this as any

    // Call disposers
    this[_disposers_].forEach(disposer => disposer())
    this[_disposers_].clear()

    // Call dispose method
    if (typeof _this.dispose === 'function') _this.dispose()
  }

  // ---------------------------------------------------------------------------
  // VERSIONER
  // ---------------------------------------------------------------------------

  static get [epos.symbols.stateModelVersioner]() {
    if (!('versioner' in this)) return null
    return this.versioner
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

  closest<T extends Unit>(Ancestor: Cls<T>): T | null {
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

  never(message = 'This should never happen') {
    const error = new Error(`[${this['@']}] ${message}`)
    Error.captureStackTrace(error, this.never)
    throw error
  }
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function getParent(child: any) {
  return child[_parent_] ?? child[epos.symbols.stateParent]
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
