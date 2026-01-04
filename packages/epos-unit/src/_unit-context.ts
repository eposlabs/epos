// import type { Arr, Cls, Obj } from 'dropcap/types'
// import { createLog, is } from 'dropcap/utils'
// import { Unit, _context_ } from './epos-unit'

// export type Node<T> = Unit<T> | Obj | Arr

// export class UnitContext<TRoot> {
//   unit: Unit<TRoot>
//   parent: Node<TRoot> | null
//   root: TRoot | null = null
//   disposers = new Set<() => void>()
//   ancestors = new Map<Cls, unknown>()
//   pendingAttachHooks: (() => void)[] = []
//   attached = false

//   constructor(unit: Unit<TRoot>, parent?: Node<TRoot> | null) {
//     this.unit = unit
//     this.parent = is.undefined(parent) ? (Reflect.get(unit, epos.state.PARENT) ?? null) : parent
//   }

//   // ---------------------------------------------------------------------------
//   // ATTACH / DETACH
//   // ---------------------------------------------------------------------------

//   attach() {
//     this.define('log', createLog(this.unit['@']))
//     epos.state.transaction(() => this.applyVersioner())
//     this.prepareMethods()
//     this.processAttachHook()
//     this.attached = true
//   }

//   detach() {
//     this.disposers.forEach(disposer => disposer())
//     this.disposers.clear()
//     const detach = Reflect.get(this.unit, 'detach')
//     if (is.function(detach)) detach()
//   }

//   // ---------------------------------------------------------------------------
//   // PUBLIC METHODS
//   // ---------------------------------------------------------------------------

//   getRoot() {
//     this.root ??= this.findRoot()
//     return this.root
//   }

//   // ---------------------------------------------------------------------------
//   // INTERNALS
//   // ---------------------------------------------------------------------------

//   private applyVersioner() {
//     const versioner = Reflect.get(this.unit.constructor, 'versioner')
//     if (!is.object(versioner)) return

//     const versions = Object.keys(versioner)
//       .map(Number)
//       .sort((v1, v2) => v1 - v2)

//     for (const version of versions) {
//       if (is.number(this.unit[':version']) && this.unit[':version'] >= version) continue
//       const versionFn = versioner[version]
//       if (!is.function(versionFn)) continue
//       versionFn.call(this.unit, this.unit)
//       this.unit[':version'] = version
//     }
//   }

//   /**
//    * - Create components for methods ending with `View`
//    * - Bind all other methods to the unit instance
//    */
//   private prepareMethods() {
//     for (const prototype of this.getPrototypes()) {
//       const descriptors = Object.getOwnPropertyDescriptors(prototype)

//       for (const [key, descriptor] of Object.entries(descriptors)) {
//         if (key === 'constructor') continue
//         if (this.unit.hasOwnProperty(key)) continue

//         if (descriptor.get || descriptor.set) continue
//         if (!is.function(descriptor.value)) continue
//         const fn = descriptor.value.bind(this.unit)

//         if (key.endsWith('View')) {
//           const Component = epos.component(fn)
//           Component.displayName = `${this.unit.constructor.name}.${key}`
//           this.define(key, Component)
//         } else {
//           this.define(key, fn)
//         }
//       }
//     }
//   }

//   private processAttachHook() {
//     const attach = Reflect.get(this.unit, 'attach')
//     if (!is.function(attach)) return

//     const unattachedRoot = this.findUnattachedRoot()
//     unattachedRoot[_context_].pendingAttachHooks.push(() => attach())

//     this.pendingAttachHooks.forEach(attach => attach())
//     this.pendingAttachHooks = []
//   }

//   // ---------------------------------------------------------------------------
//   // HELPERS
//   // ---------------------------------------------------------------------------

//   private findRoot() {
//     let root = this.unit
//     let cursor: Node<TRoot> | null = this.unit

//     while (cursor) {
//       if (cursor instanceof Unit) root = cursor
//       cursor = this.getParent(cursor)
//     }

//     return root as TRoot
//   }

//   private findUnattachedRoot() {
//     let unattachedRoot = this.unit
//     let cursor: Node<TRoot> | null = this.unit

//     while (cursor) {
//       if (cursor instanceof Unit && !cursor[_context_].attached) unattachedRoot = cursor
//       cursor = this.getParent(cursor)
//     }

//     return unattachedRoot
//   }

//   private getPrototypes(object: object = this.unit): object[] {
//     const prototype = Reflect.getPrototypeOf(object)
//     if (!prototype || prototype === Object.prototype) return []
//     return [prototype, ...this.getPrototypes(prototype)]
//   }

//   private define(key: PropertyKey, value: any) {
//     Reflect.defineProperty(this.unit, key, {
//       configurable: true,
//       get: () => value,
//       set: v => (value = v),
//     })
//   }

//   private getParent(node: Node<TRoot>) {
//     if (node instanceof Unit) return node[_context_].parent
//     const parent: Node<TRoot> | null = Reflect.get(node, epos.state.PARENT)
//     return parent
//   }
// }
