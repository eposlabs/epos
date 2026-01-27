import { createLog, is, type Arr, type Ctor, type Obj } from '@eposlabs/utils'
import { epos, type Asyncify } from 'epos'
import { customAlphabet } from 'nanoid'
import type { FC } from 'react'

export const _root_ = Symbol('root')
export const _rpcs_ = Symbol('rpcs')
export const _parent_ = Symbol('parent')
export const _attached_ = Symbol('attached')
export const _disposers_ = Symbol('disposers')
export const _ancestors_ = Symbol('ancestors')
export const _attachQueue_ = Symbol('attachQueue')
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10)

export type Node<T> = Unit<T> | Obj | Arr
export type Versioner<T> = { [version: number]: (this: T) => void }

export class Unit<TRoot = unknown> {
  declare '@': string
  declare id: string
  declare log: ReturnType<typeof createLog>;
  declare [':version']?: number;
  declare [_root_]: TRoot | null;
  declare [_rpcs_]: Record<string, unknown>;
  declare [_parent_]: Unit<TRoot> | null; // Parent reference for a not-yet-attached units
  declare [_attached_]: boolean;
  declare [_disposers_]: Set<() => void>;
  declare [_ancestors_]: Map<Ctor, unknown>;
  declare [_attachQueue_]?: (() => void)[]

  static defineVersioner<T extends Unit>(this: Ctor<T>, versioner: Versioner<T>) {
    return versioner
  }

  constructor(parent: Unit<TRoot> | null) {
    this.id = nanoid()
    this[_parent_] = parent
  }

  // #endregion
  // #region ATTACH
  // ============================================================================

  [epos.state.ATTACH]() {
    // Initialize internal properties
    defineAccessor(this, _root_, null)
    defineAccessor(this, _rpcs_, {})
    defineAccessor(this, _attached_, false)
    defineAccessor(this, _disposers_, new Set())
    defineAccessor(this, _ancestors_, new Map())

    // Setup logger
    const log = createLog(this['@'])
    defineAccessor(this, 'log', log)

    // Apply versioner
    void (() => {
      const versioner: unknown = Reflect.get(this.constructor, 'versioner')
      if (!is.object(versioner)) return

      const asc = (v1: number, v2: number) => v1 - v2
      const versions = Object.keys(versioner).filter(is.numeric).map(Number).sort(asc)
      if (versions.length === 0) return

      epos.state.transaction(() => {
        for (const version of versions) {
          if (is.number(this[':version']) && this[':version'] >= version) continue
          const versionFn = versioner[version]
          if (!is.function(versionFn)) continue
          versionFn.call(this)
          this[':version'] = version
        }
      })
    })()

    // Setup state
    void (() => {
      const descriptor = Reflect.getOwnPropertyDescriptor(this.constructor.prototype, 'state')
      if (!descriptor || !descriptor.get) return
      const value: unknown = descriptor.get.call(this)
      if (!is.object(value)) throw new Error(`'state' getter must return an object`)
      const state = epos.state.create(value)
      Reflect.defineProperty(this, 'state', { get: () => state })
      Reflect.defineProperty(state, epos.state.PARENT, { get: () => this })
    })()

    // Setup inert
    void (() => {
      const descriptor = Reflect.getOwnPropertyDescriptor(this.constructor.prototype, 'inert')
      if (!descriptor || !descriptor.get) return
      const value: unknown = descriptor.get.call(this)
      if (!is.object(value)) throw new Error(`'inert' getter must return an object`)
      Reflect.defineProperty(this, 'inert', { get: () => value })
    })()

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
          let View = createComponent(this, key, descriptor.value.bind(this) as FC<unknown>)
          Reflect.defineProperty(this, key, { configurable: true, get: () => View, set: v => (View = v) })
        }

        // Bind all other methods to the unit instance
        else if (is.function(descriptor.value)) {
          let method = descriptor.value.bind(this)
          Reflect.defineProperty(this, key, { configurable: true, get: () => method, set: v => (method = v) })
        }

        // Turn getters into MobX computed properties
        else if (descriptor.get) {
          const getter = descriptor.get
          const computed = epos.libs.mobx.computed(() => getter.call(this))
          Reflect.defineProperty(this, key, { configurable: true, get: () => computed.get(), set: descriptor.set })
        }
      }
    }

    // Queue `attach` methods on the highest unattached ancestor (might be self), do not call them immediately.
    // This way `attach` methods are called after all versioners have been applied in the entire subtree.
    const attach = Reflect.get(this, 'attach')
    if (is.function(attach)) {
      const head = findUnattachedRoot(this)
      if (!head) throw this.never()
      const attachQueue = ensureAccessor(head, _attachQueue_, [])
      attachQueue.push(() => attach.call(this))
    }

    // Release attach queue
    if (this[_attachQueue_]) {
      this[_attachQueue_].forEach(attach => attach())
      delete this[_attachQueue_]
    }

    // Mark as attached
    this[_attached_] = true
  }

  // #endregion
  // #region DETACH
  // ============================================================================

  [epos.state.DETACH]() {
    // Run disposers
    this[_disposers_].forEach(disposer => disposer())

    // Run detach method
    const detach = Reflect.get(this, 'detach')
    if (is.function(detach)) detach()
  }

  // #endregion
  // #region GETTERS & METHODS
  // ============================================================================

  /**
   * Get the root unit of the current unit's tree.
   * The result is cached for subsequent calls.
   */
  get $() {
    this[_root_] ??= findRoot(this)
    return this[_root_]
  }

  /**
   * Get access to this unit running by other application instances (tabs, popup, background, etc).
   */
  use<T>(name: string) {
    this[_rpcs_][name] ??= epos.bus.use<T>(`${this['@']}[${this.id}][${name}]`)
    return this[_rpcs_][name] as Asyncify<T>
  }

  /**
   * Expose this unit to be used by other application instances (tabs, popup, background, etc).
   */
  expose(name: string) {
    epos.bus.register(`${this['@']}[${this.id}][${name}]`, this)
    this[_disposers_].add(() => epos.bus.unregister(`${this['@']}[${this.id}][${name}]`))
  }

  /**
   * A wrapper around MobX's `autorun` that automatically disposes itself when the unit is detached.
   */
  autorun(...args: Parameters<typeof epos.libs.mobx.autorun>) {
    const disposer = epos.libs.mobx.autorun(...args)
    this[_disposers_].add(disposer)
    return disposer
  }

  /**
   * A wrapper around MobX's `reaction` that automatically disposes itself when the unit is detached.
   */
  reaction(...args: Parameters<typeof epos.libs.mobx.reaction>) {
    const disposer = epos.libs.mobx.reaction(...args)
    this[_disposers_].add(disposer)
    return disposer
  }

  /**
   * A wrapper around `setTimeout` that automatically clears the timeout when the unit is detached.
   */
  setTimeout(...args: Parameters<typeof setTimeout>) {
    const id = setTimeout(...args)
    this[_disposers_].add(() => clearTimeout(id))
    return id
  }

  /**
   * A wrapper around `setInterval` that automatically clears the interval when the unit is detached.
   */
  setInterval(...args: Parameters<typeof setInterval>) {
    const id = setInterval(...args)
    this[_disposers_].add(() => clearInterval(id))
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
  closest<T extends Unit>(Ancestor: Ctor<T>) {
    // Has cached value? -> Return it
    if (this[_ancestors_].has(Ancestor)) {
      return this[_ancestors_].get(Ancestor) as T
    }

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

// #endregion
// #region HELPERS
// ============================================================================

function defineAccessor<T extends object, K extends keyof T>(target: T, key: K, value: T[K]) {
  Reflect.defineProperty(target, key, { configurable: true, get: () => value, set: v => (value = v) })
  return value
}

function ensureAccessor<T extends object, K extends keyof T>(target: T, key: K, defaultValue: T[K]) {
  if (!(key in target)) defineAccessor(target, key, defaultValue)
  if (!target[key]) throw new Error(`Failed to ensure accessor for '${String(key)}'`)
  return target[key]
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
 * Create component for the unit.
 */
function createComponent<T>(unit: Unit<T>, name: string, render: FC<unknown>) {
  const fullName = `${unit['@']}.${name}`

  const Component = epos.component((props: unknown) => {
    try {
      return render(props)
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

  Component.displayName = fullName

  return Component
}
