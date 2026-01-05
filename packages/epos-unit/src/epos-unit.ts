import type { Arr, Cls, Obj } from 'dropcap/types'
import { createLog, is } from 'dropcap/utils'
import 'epos'

export const _root_ = Symbol('root')
export const _parent_ = Symbol('parent')
export const _attached_ = Symbol('attached')
export const _disposers_ = Symbol('disposers')
export const _ancestors_ = Symbol('ancestors')
export const _pendingAttachFns_ = Symbol('pendingAttachFns')

export type Node<T> = Unit<T> | Obj | Arr

export class Unit<TRoot = unknown> {
  declare '@': string
  declare log: ReturnType<typeof createLog>;
  declare [':version']?: number;
  declare [_root_]?: TRoot;
  declare [_parent_]?: Unit<TRoot> | null; // Parent reference for a not-yet-attached units
  declare [_attached_]?: boolean;
  declare [_disposers_]?: Set<() => void>;
  declare [_ancestors_]?: Map<Cls, unknown>;
  declare [_pendingAttachFns_]?: (() => void)[]

  constructor(parent: Unit<TRoot> | null) {
    this[_parent_] = parent
    const versions = getVersions(this)
    if (versions.length > 0) this[':version'] = versions.at(-1)!
  }

  /**
   * Lifecycle method called when the unit is attached to the state tree.
   */
  [epos.state.ATTACH]() {
    // Setup logger
    setProperty(this, 'log', createLog(this['@']))

    // Apply versioner
    epos.state.transaction(() => {
      const versioner = getVersioner(this)
      const versions = getVersions(this)
      for (const version of versions) {
        if (is.number(this[':version']) && this[':version'] >= version) continue
        const versionFn = versioner[version]
        if (!is.function(versionFn)) continue
        versionFn.call(this, this)
        this[':version'] = version
      }
    })

    // Prepare methods:
    // - Create components for methods ending with `View`
    // - Bind all other methods to the unit instance
    for (const prototype of getPrototypes(this)) {
      const descriptors = Object.getOwnPropertyDescriptors(prototype)

      for (const [key, descriptor] of Object.entries(descriptors)) {
        if (key === 'constructor') continue
        if (this.hasOwnProperty(key)) continue

        if (descriptor.get || descriptor.set) continue
        if (!is.function(descriptor.value)) continue
        const fn = descriptor.value.bind(this)

        if (key.endsWith('View')) {
          let Component = epos.component(fn)
          Component.displayName = `${this.constructor.name}.${key}`
          setProperty(this, key, Component)
        } else {
          setProperty(this, key, fn)
        }
      }
    }

    // Setup state
    const stateDescriptor = Reflect.getOwnPropertyDescriptor(this.constructor.prototype, 'state')
    if (stateDescriptor && stateDescriptor.get) {
      const state = stateDescriptor.get.call(this)
      setProperty(this, 'state', epos.libs.mobx.observable.object(state, {}, { deep: false }))
    }

    // Process attach queue.
    // We do not execute `attach` methods immediately, but rather queue them
    // on the highest unattached ancestor. This way we ensure that `attach`
    // methods are called after all versioners have been applied in the entire subtree.
    const attach = Reflect.get(this, 'attach')
    if (is.function(attach)) {
      const unattachedRoot = findUnattachedRoot(this)
      if (!unattachedRoot) throw this.never()

      ensureProperty(unattachedRoot, _pendingAttachFns_, () => [])
      unattachedRoot[_pendingAttachFns_].push(() => attach())
    }

    if (this[_pendingAttachFns_]) {
      this[_pendingAttachFns_].forEach(attach => attach())
      delete this[_pendingAttachFns_]
    }

    // Mark as attached
    setProperty(this, _attached_, true)
  }

  /**
   * Lifecycle method called when the unit is detached from the state tree.
   */
  [epos.state.DETACH]() {
    // 1. Run disposers
    if (this[_disposers_]) {
      this[_disposers_].forEach(disposer => disposer())
      this[_disposers_].clear()
    }

    // 2. Call detach method
    const detach = Reflect.get(this, 'detach')
    if (is.function(detach)) detach()

    // 3. Clean up internal properties
    delete this[_root_]
    delete this[_attached_]
    delete this[_ancestors_]
    delete this[_disposers_]
  }

  /**
   * Gets the root unit of the current unit's tree.
   * The result is cached for subsequent calls.
   */
  get $() {
    ensureProperty(this, _root_, () => findRoot(this))
    return this[_root_]
  }

  /**
   * Finds the closest ancestor unit of a given type.
   * The result is cached for subsequent calls.
   */
  closest<T extends Unit>(Ancestor: Cls<T>) {
    // Has cached value? -> Return it
    ensureProperty(this, _ancestors_, () => new Map())
    if (this[_ancestors_].has(Ancestor)) return this[_ancestors_].get(Ancestor) as T

    // Find the closest ancestor and cache it
    let cursor: Node<TRoot> | null = this
    while (cursor) {
      if (cursor instanceof Ancestor) {
        this[_ancestors_].set(Ancestor, cursor)
        return cursor
      }
      cursor = getParent(cursor)
    }

    return null
  }

  /**
   * A wrapper around MobX's `autorun` that automatically disposes
   * the reaction when the unit is detached.
   */
  autorun(...args: Parameters<typeof epos.libs.mobx.autorun>) {
    const disposer = epos.libs.mobx.autorun(...args)
    ensureProperty(this, _disposers_, () => new Set())
    this[_disposers_].add(disposer)
    return disposer
  }

  /**
   * A wrapper around MobX's `reaction` that automatically disposes
   * the reaction when the unit is detached.
   */
  reaction(...args: Parameters<typeof epos.libs.mobx.reaction>) {
    const disposer = epos.libs.mobx.reaction(...args)
    ensureProperty(this, _disposers_, () => new Set())
    this[_disposers_].add(disposer)
    return disposer
  }

  /**
   * A wrapper around `setTimeout` that automatically clears the timeout
   * when the unit is detached.
   */
  setTimeout(...args: Parameters<typeof self.setTimeout>) {
    const id = self.setTimeout(...args)
    ensureProperty(this, _disposers_, () => new Set())
    this[_disposers_].add(() => self.clearTimeout(id))
    return id
  }

  /**
   * A wrapper around `setInterval` that automatically clears the interval
   * when the unit is detached.
   */
  setInterval(...args: Parameters<typeof self.setInterval>) {
    const id = self.setInterval(...args)
    ensureProperty(this, _disposers_, () => new Set())
    this[_disposers_].add(() => self.clearInterval(id))
    return id
  }

  /**
   * Creates an error for an unreachable code path.
   */
  never(message = 'This should never happen') {
    const details = message ? `: ${message}` : ''
    const error = new Error(`[${this.constructor.name}] This should never happen${details}`)
    Error.captureStackTrace(error, this.never)
    return error
  }
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Defines a configurable property on an object.
 */
function setProperty(object: object, key: PropertyKey, value: unknown) {
  Reflect.defineProperty(object, key, {
    configurable: true,
    get: () => value,
    set: v => (value = v),
  })
}

/**
 * Ensures a property exists on an object, initializing it if it doesn't.
 */
function ensureProperty<T extends object, K extends PropertyKey, V>(
  object: T,
  key: K,
  getInitialValue: () => V,
): asserts object is T & { [key in K]: V } {
  if (key in object) return
  const value = getInitialValue()
  Reflect.defineProperty(object, key, { configurable: true, get: () => value })
}

/**
 * Gets all prototypes of an object up to `Object.prototype`.
 */
function getPrototypes(object: object): object[] {
  const prototype = Reflect.getPrototypeOf(object)
  if (!prototype || prototype === Object.prototype) return []
  return [prototype, ...getPrototypes(prototype)]
}

/**
 * Finds the root `Unit` in the hierarchy for a given unit.
 */
function findRoot<T>(unit: Unit<T>) {
  let root: Unit<T> | null = null
  let cursor: Node<T> | null = unit

  while (cursor) {
    if (cursor instanceof Unit) root = cursor
    cursor = getParent(cursor)
  }

  return root as T
}

/**
 * Finds the highest unattached `Unit` in the hierarchy for a given unit.
 */
function findUnattachedRoot<T>(unit: Unit<T>) {
  let unattachedRoot: Unit<T> | null = null
  let cursor: Node<T> | null = unit

  while (cursor) {
    if (cursor instanceof Unit && !cursor[_attached_]) unattachedRoot = cursor
    cursor = getParent(cursor)
  }

  return unattachedRoot
}

/**
 * Gets the parent of a node, which can be a `Unit`, an object, or an array.
 */
function getParent<T>(node: Node<T>) {
  const parent: Node<T> | null = Reflect.get(node, _parent_) ?? Reflect.get(node, epos.state.PARENT) ?? null
  return parent
}

/**
 * Gets the versioner object from a unit's constructor.
 */
function getVersioner<T>(unit: Unit<T>) {
  const versioner: unknown = Reflect.get(unit.constructor, 'versioner')
  if (!is.object(versioner)) return {}
  return versioner
}

/**
 * Gets a sorted list of numeric version keys from a unit's versioner.
 */
function getVersions<T>(unit: Unit<T>) {
  const versioner = getVersioner(unit)
  const numericKeys = Object.keys(versioner).filter(key => is.numeric(key))
  return numericKeys.map(Number).sort((v1, v2) => v1 - v2)
}
