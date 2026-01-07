import type { Arr, Cls, Fn, Obj } from 'dropcap/types'
import { createLog, is } from 'dropcap/utils'
import 'epos'
import { customAlphabet } from 'nanoid'

export const _root_ = Symbol('root')
export const _parent_ = Symbol('parent')
export const _attached_ = Symbol('attached')
export const _disposers_ = Symbol('disposers')
export const _ancestors_ = Symbol('ancestors')
export const _pendingAttachHooks_ = Symbol('pendingAttachHooks')
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8)

export type Node<T> = Unit<T> | Obj | Arr
export type Versioner<T> = { [version: number]: (this: T) => void }

export class Unit<TRoot = unknown> {
  declare '@': string
  declare id: string
  declare log: ReturnType<typeof createLog>;
  declare [':version']?: number;
  declare [_root_]?: TRoot;
  declare [_parent_]?: Unit<TRoot> | null; // Parent reference for a not-yet-attached units
  declare [_attached_]?: boolean;
  declare [_disposers_]?: Set<() => void>;
  declare [_ancestors_]?: Map<Cls, unknown>;
  declare [_pendingAttachHooks_]?: (() => void)[]

  static defineVersioner<T extends Unit>(this: Cls<T>, versioner: Versioner<T>) {
    return versioner
  }

  constructor(parent: Unit<TRoot> | null) {
    this.id = nanoid()
    this[_parent_] = parent
    const versions = getVersions(this)
    if (versions.length > 0) this[':version'] = versions.at(-1)!
  }

  // ---------------------------------------------------------------------------
  // ATTACH
  // ---------------------------------------------------------------------------

  /**
   * Lifecycle method called when the unit is attached to the state tree.
   */
  [epos.state.ATTACH]() {
    // Apply versioner
    epos.state.transaction(() => {
      const versioner = getVersioner(this)
      const versions = getVersions(this)
      for (const version of versions) {
        if (is.number(this[':version']) && this[':version'] >= version) continue
        const versionFn = versioner[version]
        if (!is.function(versionFn)) continue
        versionFn.call(this)
        this[':version'] = version
      }
    })

    // Setup logger
    let log = createLog(this['@'])
    Reflect.defineProperty(this, 'log', {
      configurable: true,
      get: () => log,
      set: v => (log = v),
    })

    // Setup state
    const stateDescriptor = Reflect.getOwnPropertyDescriptor(this.constructor.prototype, 'state')
    if (stateDescriptor && stateDescriptor.get) {
      const value = stateDescriptor.get.call(this)
      const state = epos.state.local(value)
      Reflect.defineProperty(state, epos.state.PARENT, { value: this })
      Reflect.defineProperty(this, 'state', { enumerable: true, get: () => state })
    }

    // Setup static
    const staticDescriptor = Reflect.getOwnPropertyDescriptor(this.constructor.prototype, 'static')
    if (staticDescriptor && staticDescriptor.get) {
      let value = staticDescriptor.get.call(this)
      Reflect.defineProperty(this, 'static', {
        enumerable: true,
        get: () => value,
        set: v => (value = v),
      })
    }

    // Prepare properties for the whole prototype chain:
    // - Create components for methods ending with `View`
    // - Bind all other methods to the unit instance
    // - Turn getters into MobX computed properties
    for (const prototype of getPrototypes(this)) {
      const descriptors = Object.getOwnPropertyDescriptors(prototype)
      for (const [key, descriptor] of Object.entries(descriptors)) {
        // Skip constructor and already defined properties
        if (key === 'constructor') continue
        if (this.hasOwnProperty(key)) continue

        // Create components for methods ending with `View`
        if (is.function(descriptor.value) && key.endsWith('View')) {
          let View = createView(this, key, descriptor.value.bind(this))
          Reflect.defineProperty(this, key, {
            configurable: true,
            get: () => View,
            set: v => (View = v),
          })
        }

        // Bind all other methods to the unit instance
        else if (is.function(descriptor.value)) {
          let method = descriptor.value.bind(this)
          Reflect.defineProperty(this, key, {
            configurable: true,
            get: () => method,
            set: v => (method = v),
          })
        }

        // Turn getters into MobX computed properties
        else if (descriptor.get) {
          const getter = descriptor.get
          const computed = epos.libs.mobx.computed(() => getter.call(this))
          Reflect.defineProperty(this, key, {
            configurable: true,
            get: () => computed.get(),
            set: descriptor.set,
          })
        }
      }
    }

    // Queue attach hook.
    // Do not execute `attach` hooks immediately, but rather queue them on the highest unattached ancestor.
    // This way `attach` hooks are called after all versioners have been applied in the entire subtree.
    const attach = Reflect.get(this, 'attach')
    if (is.function(attach)) {
      const unattachedRoot = findUnattachedRoot(this)
      if (!unattachedRoot) throw this.never()
      ensure(unattachedRoot, _pendingAttachHooks_, () => [])
      unattachedRoot[_pendingAttachHooks_].push(() => attach())
    }

    // Release attach hooks
    if (this[_pendingAttachHooks_]) {
      this[_pendingAttachHooks_].forEach(attach => attach())
      delete this[_pendingAttachHooks_]
    }

    // Mark as attached
    Reflect.defineProperty(this, _attached_, { configurable: true, get: () => true })
  }

  // ---------------------------------------------------------------------------
  // DETACH
  // ---------------------------------------------------------------------------

  /**
   * Lifecycle method called when the unit is detached from the state tree.
   */
  [epos.state.DETACH]() {
    // Run and clear disposers
    if (this[_disposers_]) {
      this[_disposers_].forEach(disposer => disposer())
      this[_disposers_].clear()
    }

    // Clear ancestors cache
    if (this[_ancestors_]) {
      this[_ancestors_].clear()
    }

    // Call detach method
    const detach = Reflect.get(this, 'detach')
    if (is.function(detach)) detach()
  }

  // ---------------------------------------------------------------------------
  // ROOT GETTER
  // ---------------------------------------------------------------------------

  /**
   * Get the root unit of the current unit's tree.
   * The result is cached for subsequent calls.
   */
  get $() {
    ensure(this, _root_, () => findRoot(this))
    return this[_root_]
  }

  // ---------------------------------------------------------------------------
  // METHODS
  // ---------------------------------------------------------------------------

  /**
   * A wrapper around MobX's `autorun` that automatically disposes the reaction when the unit is detached.
   */
  autorun(...args: Parameters<typeof epos.libs.mobx.autorun>) {
    const disposer = epos.libs.mobx.autorun(...args)
    ensure(this, _disposers_, () => new Set())
    this[_disposers_].add(disposer)
    return disposer
  }

  /**
   * A wrapper around MobX's `reaction` that automatically disposes the reaction when the unit is detached.
   */
  reaction(...args: Parameters<typeof epos.libs.mobx.reaction>) {
    const disposer = epos.libs.mobx.reaction(...args)
    ensure(this, _disposers_, () => new Set())
    this[_disposers_].add(disposer)
    return disposer
  }

  /**
   * A wrapper around `setTimeout` that automatically clears the timeout when the unit is detached.
   */
  setTimeout(...args: Parameters<typeof self.setTimeout>) {
    const id = self.setTimeout(...args)
    ensure(this, _disposers_, () => new Set())
    this[_disposers_].add(() => self.clearTimeout(id))
    return id
  }

  /**
   * A wrapper around `setInterval` that automatically clears the interval when the unit is detached.
   */
  setInterval(...args: Parameters<typeof self.setInterval>) {
    const id = self.setInterval(...args)
    ensure(this, _disposers_, () => new Set())
    this[_disposers_].add(() => self.clearInterval(id))
    return id
  }

  /**
   * Create an error for code paths that are logically unreachable.
   */
  never(message = 'This should never happen') {
    const details = message ? `: ${message}` : ''
    const error = new Error(`[${this['@']}] This should never happen${details}`)
    Error.captureStackTrace(error, this.never)
    return error
  }

  /**
   * Find the closest ancestor unit of a given type.
   * The result is cached for subsequent calls.
   */
  closest<T extends Unit>(Ancestor: Cls<T>) {
    // Has cached value? -> Return it
    ensure(this, _ancestors_, () => new Map())
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
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Ensure a property exists on an object, initialize it if it doesn't.
 */
function ensure<T extends object, K extends PropertyKey, V>(
  object: T,
  key: K,
  getInitialValue: () => V,
): asserts object is T & { [key in K]: V } {
  if (key in object) return
  const value = getInitialValue()
  Reflect.defineProperty(object, key, { configurable: true, get: () => value })
}

/**
 * Get all prototypes of an object up to `Object.prototype`.
 */
function getPrototypes(object: object): object[] {
  const prototype = Reflect.getPrototypeOf(object)
  if (!prototype || prototype === Object.prototype) return []
  return [prototype, ...getPrototypes(prototype)]
}

/**
 * Find the root `Unit` in the hierarchy for a given unit.
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
 * Find the highest unattached `Unit` in the hierarchy for a given unit.
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
 * Get the parent of a node, which can be a `Unit`, an object, or an array.
 */
function getParent<T>(node: Node<T>) {
  const parent: Node<T> | null = Reflect.get(node, _parent_) ?? Reflect.get(node, epos.state.PARENT) ?? null
  return parent
}

/**
 * Get the versioner object for a unit.
 */
function getVersioner<T>(unit: Unit<T>) {
  const versioner: unknown = Reflect.get(unit.constructor, 'versioner')
  if (!is.object(versioner)) return {}
  return versioner
}

/**
 * Get a sorted list of numeric versions defined in unit's versioner.
 */
function getVersions<T>(unit: Unit<T>) {
  const versioner = getVersioner(unit)
  const numericKeys = Object.keys(versioner).filter(key => is.numeric(key))
  return numericKeys.map(Number).sort((v1, v2) => v1 - v2)
}

/**
 * Create view component for the unit.
 */
function createView<T>(unit: Unit<T>, name: string, render: Fn) {
  const fullName = `${unit['@']}.${name}`

  const View = epos.component((...args: unknown[]) => {
    try {
      return render(...args)
    } catch (error) {
      unit.log.error(error)
      const message = is.error(error) ? error.message : String(error)
      return epos.libs.reactJsxRuntime.jsx('div', {
        children: `[${fullName}] ${message}`,
        style: {
          width: 'fit-content',
          padding: '4px 6px 4px 4px',
          color: '#f00',
          border: '1px solid #f00',
          background: 'rgba(255, 0, 0, 0.1)',
          fontSize: 12,
          fontWeight: 400,
        },
      })
    }
  })

  View.displayName = fullName

  return View
}
