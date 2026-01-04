import type { Cls } from 'dropcap/types'
import { createLog, is, Log } from 'dropcap/utils'
import 'epos'

export const _root_ = Symbol('root')
export const _parent_ = Symbol('parent')
export const _ancestors_ = Symbol('ancestors')
export const _disposers_ = Symbol('disposers')
export const _attached_ = Symbol('attached')
export const _pendingAttachHooks_ = Symbol('pendingAttachHooks')

export class Unit<TRoot = unknown> {
  declare '@': string;
  declare [':version']?: number
  declare log: Log
  declare private [_root_]: TRoot
  declare private [_parent_]: Unit<TRoot> | null // Parent reference for a not-yet-attached units
  declare private [_ancestors_]: Map<Cls, unknown>
  declare private [_disposers_]: Set<() => void>
  declare private [_attached_]: boolean
  declare private [_pendingAttachHooks_]?: (() => void)[]

  constructor(parent: Unit<TRoot> | null) {
    Reflect.defineProperty(this, _parent_, { get: () => parent })
  }

  [epos.state.ATTACH]() {
    const prototypeDescriptors = Object.getOwnPropertyDescriptors(this.constructor.prototype)
    const prototypeKeys = Reflect.ownKeys(prototypeDescriptors)

    // Apply versioner
    epos.state.transaction(() => applyVersioner(this))

    // Setup disposers
    const disposers = new Set()
    Reflect.defineProperty(this, _disposers_, { get: () => disposers })

    // Setup ancestors
    const ancestors = new Map()
    Reflect.defineProperty(this, _ancestors_, { get: () => ancestors })

    // Setup logger
    const log = createLog(this['@'])
    Reflect.defineProperty(this, 'log', { get: () => log })

    // Process prototype methods:
    // - Bind all methods to `this`
    // - Wrap methods ending with `View` into components
    for (const key of prototypeKeys) {
      if (is.symbol(key)) continue
      if (key === 'constructor') continue

      const descriptor = prototypeDescriptors[key]
      if (!descriptor) continue
      if (descriptor.get || descriptor.set) continue
      if (!is.function(descriptor.value)) continue
      const fn = descriptor.value.bind(this)

      if (key.endsWith('View')) {
        const Component = epos.component(fn)
        Component.displayName = `${this.constructor.name}.${key}`
        Reflect.defineProperty(this, key, { configurable: true, get: () => Component })
      } else {
        Reflect.defineProperty(this, key, { configurable: true, get: () => fn })
      }
    }

    // Process attach hook
    processAttachHook(this)

    // Mark as attached
    Reflect.defineProperty(this, _attached_, { get: () => true })
  }

  [epos.state.DETACH]() {
    // Call disposers
    this[_disposers_].forEach(disposer => disposer())
    this[_disposers_].clear()

    // Call `detach` method
    const detach = Reflect.get(this, 'detach')
    if (is.function(detach)) detach()
  }

  get $() {
    if (this[_root_]) return this[_root_]
    const root = findRoot(this)
    Reflect.defineProperty(this, _root_, { get: () => root })
    return root
  }

  closest<T extends Unit>(Ancestor: Cls<T>): T | null {
    if (this[_ancestors_].has(Ancestor)) return this[_ancestors_].get(Ancestor) as T

    let cursor: unknown = getParent(this)
    while (cursor) {
      if (cursor instanceof Ancestor) {
        this[_ancestors_].set(Ancestor, cursor)
        return cursor
      }
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
    const details = message ? `: ${message}` : ''
    const error = new Error(`[${this.constructor.name}] This should never happen${details}`)
    Error.captureStackTrace(error, this.never)
    return error
  }
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function applyVersioner<T>(unit: Unit<T>) {
  const versioner: Record<number, (unit: Unit<T>) => void> | undefined = (unit.constructor as any).versioner
  if (!versioner) return

  const versions = Object.keys(versioner)
    .map(Number)
    .sort((v1, v2) => v1 - v2)

  for (const version of versions) {
    if (is.number(unit[':version']) && unit[':version'] >= version) continue
    const versionFn = versioner[version]
    if (!versionFn) throw unit.never()
    versionFn.call(unit, unit)
    unit[':version'] = version
  }
}

function processAttachHook<T>(unit: Unit<T>) {
  const attach = Reflect.get(unit, 'attach')
  if (!is.function(attach)) return

  const head = findHead(unit)
  head[_pendingAttachHooks_] ??= []
  head[_pendingAttachHooks_].push(() => attach())

  if (!unit[_pendingAttachHooks_]) return
  unit[_pendingAttachHooks_].forEach(attach => attach())
  delete unit[_pendingAttachHooks_]
}

function findRoot<T>(unit: Unit<T>) {
  let root = unit
  let cursor = unit

  while (cursor) {
    if (cursor instanceof Unit) root = cursor
    cursor = getParent(cursor)
  }

  return root as T
}

/** Find the highest unattached unit in the hierarchy. */
function findHead<T>(unit: Unit<T>) {
  let head = unit
  let cursor = unit

  while (cursor) {
    if (cursor instanceof Unit && !cursor[_attached_]) head = cursor
    cursor = getParent(cursor)
  }

  return head
}

function getParent(child: any) {
  return child[_parent_] ?? child[epos.state.PARENT]
}
