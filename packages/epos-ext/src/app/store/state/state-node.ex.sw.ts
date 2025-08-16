import type { IObservableFactory } from 'mobx'
import type { Array as YjsArray, Map as YjsMap } from 'yjs'
import type { Unit } from '../store-units.ex.sw'
import type { Value } from './state.ex.sw'

export const _meta_ = Symbol('meta')
export const _keys_ = Symbol('keys')

export type MObj = Obj
export type MArr = Arr
export type MNode = (MObj | MArr) & { [_meta_]?: Meta }

export type YMap = YjsMap<unknown>
export type YArr = YjsArray<unknown>
export type YNode = (YMap | YArr) & { [_meta_]?: Meta }

export type Owner = MNode | null

export type Meta = {
  mNode: MNode
  yNode: YNode
  owner: Owner
  unobserve: () => void
}

export class StateNode extends $exSw.Unit {
  private $state = this.up($exSw.State, 'internal')!
  private $units = this.up($exSw.Store, 'internal')!.units
  private static _meta_ = _meta_

  // TODO: maybe use target.getOwner (?)
  static getOwner(target: any) {
    const meta = this.prototype.getMeta(target)
    return meta?.owner ?? null
  }

  create(target: YMap, owner?: Owner): MObj
  create(target: YArr, owner?: Owner): MArr
  create(target: Obj, owner?: Owner): MObj
  create(target: Arr, owner?: Owner): MArr
  create<T extends Value>(target: T, owner?: Owner): T
  create<T extends unknown>(target: T, owner?: Owner): never
  create<T>(target: T, owner: Owner = null) {
    if (target instanceof this.$.libs.yjs.Map) {
      return this.createFromYMap(target, owner)
    } else if (target instanceof this.$.libs.yjs.Array) {
      return this.createFromYArray(target, owner)
    } else if (this.$.is.object(target)) {
      return this.createFromObject(target, owner)
    } else if (this.$.is.array(target)) {
      return this.createFromArray(target, owner)
    } else if (this.isSupportedPrimitive(target)) {
      return target
    }

    const type = Object.prototype.toString.call(target)
    throw new Error(`Unsupported value type: ${type}`)
  }

  detach(target: unknown) {
    const meta = this.getMeta(target)
    const isUnit = this.$units.isUnit(target)

    if (meta) {
      meta.unobserve()
      delete meta.mNode[_meta_]
      delete meta.yNode[_meta_]
      if (isUnit) this.$units.cleanup(target)
    }

    if (isUnit) {
      for (const key of this.$units.getAnnotationKeys(target)) {
        this.detach((target as any)[key])
      }
    } else if (this.$.is.object(target)) {
      for (const key in target) {
        this.detach(target[key])
      }
    } else if (this.$.is.array(target)) {
      for (const item of target) {
        this.detach(item)
      }
    }
  }

  getMNode<T extends YNode>(yNode: T) {
    const meta = this.getMeta(yNode)
    if (!meta) return null
    return meta.mNode as T extends YMap ? MNode : MArr
  }

  getYNode<T extends MNode>(node: T) {
    const meta = this.getMeta(node)
    if (!meta) return null
    return meta.yNode as T extends MObj ? YMap : YArr
  }

  private getMeta(target: any) {
    return (target?.[_meta_] as Meta) ?? null
  }

  private createFromYMap(yMap: YMap, owner: Owner = null) {
    // Check if unit
    const spec = yMap.get('@')
    const isUnit = this.$units.isUnitSpec(spec)

    // Create empty node
    const mNode = isUnit
      ? this.createEmptyMobxUnit(spec, [...yMap.keys()])
      : this.createEmptyMobxObject()

    // Attach node
    this.attach(mNode, yMap, owner, [...yMap.keys()])

    // Fill recursively
    for (const key of yMap.keys()) {
      mNode[key] = this.create(yMap.get(key), mNode)
    }

    this.observe(mNode)

    // Setup unit
    if (isUnit) {
      this.setupUnit(mNode as unknown as Unit)
    }

    return mNode
  }

  private createFromYArray(yArray: YArr, owner: Owner = null) {
    // Create empty node
    const mNode = this.createEmptyMobxArray()

    // Attach node
    this.attach(mNode, yArray, owner)

    // Fill recursively
    for (let i = 0; i < yArray.length; i++) {
      mNode.push(this.create(yArray.get(i), mNode))
    }

    this.observe(mNode)

    return mNode
  }

  private createFromObject(object: Obj, owner: Owner = null) {
    // Check if unit
    const spec = object['@']
    const isUnit = this.$units.isUnitSpec(spec)

    // Create empty node
    const mNode = isUnit
      ? this.createEmptyMobxUnit(spec, Object.keys(object))
      : this.createEmptyMobxObject()
    const yNode = !owner ? this.$state.doc.getMap('root') : new this.$.libs.yjs.Map()

    // Attach node
    this.attach(mNode, yNode, owner, [...Object.keys(object)])

    // Fill recursively
    for (const key in object) {
      mNode[key] = this.create(object[key], mNode)
      const meta = this.getMeta(mNode[key])
      yNode.set(key, meta?.yNode ?? object[key])
    }

    this.observe(mNode)

    // Setup unit
    if (isUnit) {
      this.setupUnit(mNode as unknown as Unit)
    }

    return mNode
  }

  private createFromArray(array: Arr, owner: Owner = null) {
    // Create empty node
    const mNode = this.createEmptyMobxArray()
    const yNode = new this.$.libs.yjs.Array()

    // Attach node
    this.attach(mNode, yNode, owner)

    // Fill recursively
    for (const item of array) {
      mNode.push(this.create(item, mNode))
      const meta = this.getMeta(mNode.at(-1))
      yNode.insert(mNode.length - 1, [meta?.yNode ?? item])
    }

    this.observe(mNode)

    return mNode
  }

  private isSupportedPrimitive(value: unknown) {
    return (
      this.$.is.undefined(value) ||
      this.$.is.null(value) ||
      this.$.is.boolean(value) ||
      this.$.is.number(value) ||
      this.$.is.string(value)
    )
  }

  private createEmptyMobxObject() {
    const object = this.$.libs.mobx.observable.object({}, {}, { deep: false })
    return object as unknown as MObj
  }

  private createEmptyMobxArray() {
    const array = this.$.libs.mobx.observable.array([], { deep: false })
    return array as unknown as MArr
  }

  private createEmptyMobxUnit(spec: string, keys: string[]) {
    // Create empty unit shape and construct MobX annotations
    const unit: MObj = {}
    const annotations: Record<string, IObservableFactory['ref']> = {}
    for (const key of keys) {
      unit[key] = undefined
      annotations[key] = this.$.libs.mobx.observable
    }

    // Make unit observable
    this.$.libs.mobx.makeObservable(unit, annotations, { deep: false })

    // Apply unit prototype. Must be called after 'makeObservable' otherwise keys
    // become non-configurable and we can't delete them during versioning.
    const Unit = this.$units.getClassBySpec(spec)
    if (!Unit) throw this.never
    Reflect.setPrototypeOf(unit, Unit.prototype)

    return unit
  }

  private setupUnit(unit: Unit) {
    // Why whenInitialized? When unit runs versioner, changes should be broadcasted
    // to other peers, but broadcasting is enabled only after the state is initialized.
    this.$state.setup.whenInitialized(() => {
      this.$units.setup(unit)
    })
  }

  private attach(mNode: MNode, yNode: YNode, owner: Owner = null, keys = null) {
    // Observe mNode and yNode for changes
    // const unobserve = this.$state.observer.observe(mNode, yNode)

    // Add meta for mNode and yNode
    const meta: Meta = { mNode, yNode, owner, unobserve: null }
    Reflect.defineProperty(mNode, _meta_, { configurable: true, get: () => meta })
    Reflect.defineProperty(yNode, _meta_, { configurable: true, get: () => meta })

    // Add peeker for mNode
    Reflect.defineProperty(mNode, '_', { get: () => this.$.libs.mobx.toJS(mNode) })

    if (keys) {
      Reflect.defineProperty(mNode, _keys_, { get: () => keys })
    }

    // console.log(this.trace(mNode))
    // console.log(mNode._, this.trace(mNode))
  }

  observe(mNode) {
    const meta = this.getMeta(mNode)
    meta.unobserve = this.$state.observer.observe(mNode, meta.yNode)
  }

  private trace(mNode) {
    let cursor = mNode
    const path = []
    while (true) {
      const owner = $exSw.StateNode.getOwner(cursor)
      if (!owner) break
      const keys = Object.keys(owner)
      const key = keys.find(k => owner[k] === cursor)
      path.unshift(key)
      cursor = owner
    }
    return path
  }
}
