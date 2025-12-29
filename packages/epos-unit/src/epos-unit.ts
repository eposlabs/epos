import type { Cls } from 'dropcap/types'
import { createLog, is, Log } from 'dropcap/utils'
import 'epos'

export const _root_ = Symbol('root')
export const _parent_ = Symbol('parent')
export const _ancestors_ = Symbol('ancestors')
export const _disposers_ = Symbol('disposers')
export type Descriptors = Record<string | symbol, PropertyDescriptor>

export class Unit<TRoot = unknown> {
  declare '@': string;
  declare [':version']?: number
  declare log: Log
  declare private [_root_]: TRoot
  declare private [_parent_]: Unit<TRoot> | null // Parent reference for a not-yet-attached units
  declare private [_ancestors_]: Map<Cls, unknown>
  declare private [_disposers_]: Set<() => void>

  constructor(parent: Unit<TRoot> | null) {
    Reflect.defineProperty(this, _parent_, { get: () => parent })
  }

  async [epos.state.ATTACH]() {
    epos.state.transaction(() => {
      const versioner: Record<number, (unit: Unit<TRoot>) => void> | undefined = (this.constructor as any)
        .versioner

      if (versioner) {
        const versions = Object.keys(versioner)
          .map(Number)
          .sort((v1, v2) => v1 - v2)

        for (const version of versions) {
          if (is.number(this[':version']) && this[':version'] >= version) continue
          const versionFn = versioner[version]
          if (!versionFn) throw this.never()
          versionFn.call(this, this)
          this[':version'] = version
        }
      }
    })

    const thisAsAny = this as any
    const disposers = new Set()
    const ancestors = new Map()
    Reflect.defineProperty(this, _disposers_, { get: () => disposers })
    Reflect.defineProperty(this, _ancestors_, { get: () => ancestors })

    const Unit = this.constructor
    const descriptors: Descriptors = Object.getOwnPropertyDescriptors(Unit.prototype)
    const keys = Reflect.ownKeys(descriptors)

    // Create logger
    this.log = createLog(this['@'])

    // Bind all methods
    for (const key of keys) {
      if (key === 'constructor') continue
      const descriptor = descriptors[key]
      if (!descriptor) continue
      if (descriptor.get || descriptor.set) continue
      if (!is.function(descriptor.value)) continue
      thisAsAny[key] = descriptor.value.bind(this)
    }

    // Create components out of `View` methods
    for (const key of keys) {
      if (is.symbol(key)) continue
      if (!key.endsWith('View')) continue
      const descriptor = descriptors[key]
      if (!descriptor) continue
      if (descriptor.get || descriptor.set) continue
      if (!is.function(thisAsAny[key])) continue
      const Component = epos.component(thisAsAny[key])
      Component.displayName = `${this['@']}.${key}`
      Reflect.defineProperty(this, key, { get: () => Component })
    }

    // Call `attach` method
    if (is.function(thisAsAny.attach)) await thisAsAny.attach()
  }

  [epos.state.DETACH]() {
    const thisAsAny = this as any

    // Call disposers
    this[_disposers_].forEach(disposer => disposer())
    this[_disposers_].clear()

    // Call `detach` method
    if (is.function(thisAsAny.detach)) thisAsAny.detach()
  }

  get $() {
    return (this[_root_] ??= findRoot<TRoot>(this))
  }

  closest<T extends Unit>(Ancestor: Cls<T>): T | null {
    const ancestors = (this[_ancestors_] ??= new Map())
    if (ancestors.has(Ancestor)) return ancestors.get(Ancestor) as T

    let cursor: unknown = getParent(this)
    while (cursor) {
      if (cursor instanceof Ancestor) {
        ancestors.set(Ancestor, cursor)
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
    const error = new Error(`[${this['@']}] ${message}`)
    Error.captureStackTrace(error, this.never)
    throw error
  }
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function getParent(child: any) {
  return child[_parent_] ?? child[epos.state.PARENT]
}

function findRoot<T>(unit: Unit): T {
  let root = unit
  let cursor: any = unit

  while (cursor) {
    if (cursor instanceof Unit) root = cursor
    cursor = getParent(cursor)
  }

  return root as T
}

// function defineProperty(target: InstanceType<Cls>, key: PropertyKey, value: unknown) {
//   Reflect.defineProperty(target, key, {
//     configurable: true,
//     get: () => value,
//     set: v => (value = v),
//   })
// }
