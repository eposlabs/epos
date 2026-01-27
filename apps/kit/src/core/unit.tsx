import { createLog, get, is, set, type Arr, type Cls, type Obj } from 'dropcap/utils'
import { epos, type Asyncify } from 'epos'
import { customAlphabet } from 'nanoid'

import type { FC } from 'react'

export const _dev_ = Symbol('dev')
export const _root_ = Symbol('root')
export const _rpcs_ = Symbol('rpcs')
export const _parent_ = Symbol('parent')
export const _attached_ = Symbol('attached')
export const _disposers_ = Symbol('disposers')
export const _ancestors_ = Symbol('ancestors')
export const _attachQueue_ = Symbol('pendingAttachHooks')
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10)

export type Node<T> = Unit<T> | Obj | Arr
export type Versioner<T> = { [version: number]: (this: T) => void }

export class Unit<TRoot = unknown> {
  declare '@': string
  declare id: string
  declare log: ReturnType<typeof createLog>;
  declare [':version']?: number;
  declare [_root_]?: TRoot;
  declare [_rpcs_]?: Record<string, unknown>;
  declare [_parent_]?: Unit<TRoot> | null; // Parent reference for a not-yet-attached units
  declare [_attached_]?: boolean;
  declare [_disposers_]?: Set<() => void>;
  declare [_ancestors_]?: Map<Cls, unknown>;
  declare [_attachQueue_]?: (() => void)[]
  static DEV = _dev_

  static defineVersioner<T extends Unit>(this: Cls<T>, versioner: Versioner<T>) {
    return versioner
  }

  constructor(parent: Unit<TRoot> | null) {
    this.id = nanoid()
    this[_parent_] = parent
  }

  // #endregion
  // #region ATTACH
  // ============================================================================

  /**
   * Lifecycle method called when the unit is attached to the state tree.
   */
  [epos.state.ATTACH]() {
    // Setup logger
    let log = createLog(this['@'])
    Reflect.defineProperty(this, 'log', { configurable: true, get: () => log, set: v => (log = v) })

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
      if (!is.object(value)) throw new Error(`'state' getter return an object`)
      const state = epos.state.create(value)
      // It is important to have `state` and `inert` non-enumerable to avoid issues when unit is added to state
      Reflect.defineProperty(state, epos.state.PARENT, { configurable: true, value: this })
      Reflect.defineProperty(this, 'state', { enumerable: false, get: () => state })
    })()

    // Setup inert
    void (() => {
      const descriptor = Reflect.getOwnPropertyDescriptor(this.constructor.prototype, 'inert')
      if (!descriptor || !descriptor.get) return
      const value: unknown = descriptor.get.call(this)
      if (!is.object(value)) throw new Error(`'inert' getter return an object`)
      Reflect.defineProperty(this, 'inert', { enumerable: false, get: () => value })
    })()

    // Setup dev
    void (() => {
      if (this instanceof UnitDev) return
      const dev = epos.state.create(new UnitDev(this))
      Reflect.defineProperty(dev, epos.state.PARENT, { configurable: true, value: this })
      Reflect.defineProperty(this, _dev_, { enumerable: false, get: () => dev })
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
          let View = createView(this, key, descriptor.value.bind(this) as FC<unknown>)
          Reflect.defineProperty(this, key, { configurable: true, get: () => View, set: v => (View = v) })
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

    // Queue attach method.
    // Do not execute `attach` methods immediately, but rather queue them on the highest unattached ancestor.
    // This way `attach` methods are called after all versioners have been applied in the entire subtree.
    const attach = Reflect.get(this, 'attach')
    if (is.function(attach)) {
      const head = findUnattachedRoot(this)
      if (!head) throw this.never()
      ensure(head, _attachQueue_, () => [])
      head[_attachQueue_].push(() => attach.call(this))
    }

    // Release attach queue
    if (this[_attachQueue_]) {
      this[_attachQueue_].forEach(attach => attach())
      delete this[_attachQueue_]
    }

    // Mark as attached
    Reflect.defineProperty(this, _attached_, { configurable: true, get: () => true })
  }

  // #endregion
  // #region DETACH
  // ============================================================================

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

  // #endregion
  // #region ROOT GETTER
  // ============================================================================

  /**
   * Get the root unit of the current unit's tree.
   * The result is cached for subsequent calls.
   */
  get $() {
    ensure(this, _root_, () => findRoot(this))
    return this[_root_]
  }

  // #endregion
  // #region METHODS
  // ============================================================================

  use<T>(id: string) {
    ensure(this, _rpcs_, () => ({}))
    this[_rpcs_][id] ??= epos.bus.use<T>(`${this['@']}.${id}[${this.id}]`)
    return this[_rpcs_][id] as Asyncify<T>
  }

  expose(id: string) {
    epos.bus.register(`${this['@']}.${id}[${this.id}]`, this)
    ensure(this, _disposers_, () => new Set())
    this[_disposers_].add(() => epos.bus.unregister(`${this['@']}.${id}[${this.id}]`))
  }

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
  setTimeout(...args: Parameters<typeof setTimeout>) {
    const id = setTimeout(...args)
    ensure(this, _disposers_, () => new Set())
    this[_disposers_].add(() => clearTimeout(id))
    return id
  }

  /**
   * A wrapper around `setInterval` that automatically clears the interval when the unit is detached.
   */
  setInterval(...args: Parameters<typeof setInterval>) {
    const id = setInterval(...args)
    ensure(this, _disposers_, () => new Set())
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

// #endregion
// #region HELPERS
// ============================================================================

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
 * Create view component for the unit.
 */
function createView<T>(unit: Unit<T>, name: string, render: FC<unknown>) {
  const fullName = `${unit['@']}.${name}`

  const View = epos.component((props: unknown) => {
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

  View.displayName = fullName

  return View
}

// #endregion
// #region DEV UNIT
// ============================================================================

export class UnitDev extends Unit {
  get parent() {
    return (this as any)[epos.state.PARENT]
  }

  get state() {
    return {
      path: [] as string[],
      ui: {} as Obj,
    }
  }

  get panels() {
    const stack: string[] = []
    return [
      ...this.state.path.map(key => {
        stack.push(key)
        return [...stack]
      }),
    ]
  }

  View() {
    return (
      <div className="ml-0 flex gap-0">
        <this.SelfView />
        {this.panels.map(path => {
          return <this.ItemView key={path.join('.')} path={path} />
        })}
      </div>
    )
  }

  SelfView() {
    const keys = Object.keys(this.parent)
    const otherKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(this.parent))
    return (
      <div className="h-full min-w-50 shrink-0 border border-gray-300 p-4">
        {keys.map(key => (
          <div key={key} className="mb-2 cursor-pointer select-none" onClick={() => (this.state.path = [key])}>
            {key}
          </div>
        ))}
        <div className="my-2 h-px w-full bg-gray-300" />
        {otherKeys.map(key => {
          if (key === 'constructor') return null
          if (key === 'attach') return null
          if (key === 'detach') return null
          return (
            <div key={key} className="mb-2 cursor-pointer select-none" onClick={() => (this.state.path = [key])}>
              {key}
            </div>
          )
        })}
      </div>
    )
  }

  ItemView({ path }: { path: string[] }) {
    const item = get(this.parent, path)

    if (item instanceof Unit) {
      const dev = item[_dev_]
      if (!dev) return <div>Unit has no dev</div>
      return <dev.View />
    }

    if (is.object(item)) {
      const keys = Object.keys(item)

      return (
        <div className="h-full min-w-50 shrink-0 border border-gray-300 p-4">
          {keys.map(key => (
            <div key={key} className="mb-2 cursor-pointer select-none" onClick={() => (this.state.path = [...path, key])}>
              {key}
            </div>
          ))}
        </div>
      )
    }

    if (is.array(item)) {
      return (
        <div className="h-full min-w-50 shrink-0 border border-gray-300 p-4">
          {item.map((_, index) => (
            <div
              key={index}
              className="mb-2 cursor-pointer select-none"
              onClick={() => (this.state.path = [...path, String(index)])}
            >
              [{index}]
            </div>
          ))}
        </div>
      )
    }

    if (is.function(item)) {
      return (
        <div className="h-full min-w-50 shrink-0 border border-gray-300 p-4">
          ƒ {item.name.replace('bound ', '') || 'anonymous'} ({item.length})
        </div>
      )
    }

    if (is.string(item)) {
      if (path.length === 1) {
        const key = path[0]
        const uiConfig = this.parent.constructor.uiConfig || {}
        const config = uiConfig[key as string]
        if (config) {
          if (config.type === 'select') {
            return (
              <div className="h-full min-w-50 shrink-0 border border-gray-300 p-4">
                <select
                  className="w-full border border-gray-300 p-1"
                  value={item}
                  onChange={e => {
                    set(this.parent, path, e.currentTarget.value)
                  }}
                >
                  {(config.options || []).map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )
          }
        }
      }
      return (
        <div className="h-full min-w-50 shrink-0 border border-gray-300 p-4">
          <input
            type="text"
            className="w-full border border-gray-300 p-1"
            value={item}
            onChange={e => {
              set(this.parent, path, e.currentTarget.value)
            }}
          />
        </div>
      )
    }

    return <div className="h-full min-w-50 shrink-0 border border-gray-300 p-4">{JSON.stringify(item)}</div>
  }
}

epos.state.register({ UnitDev })
