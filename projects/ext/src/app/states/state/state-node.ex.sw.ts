import type { IObservableFactory } from 'mobx'
import type { Array as YjsArray, Map as YjsMap } from 'yjs'
import type { Value } from './state.ex.sw'
import type { Unit } from '../states-units.ex.sw'

export const _meta_ = Symbol('meta')
export const _keys_ = Symbol('keys')

// MobX node
export type MObj = Obj
export type MArr = Arr
export type MNode = (MObj | MArr) & { [_meta_]?: Meta; _?: unknown; __?: unknown }

// Yjs node
export type YMap = YjsMap<unknown>
export type YArr = YjsArray<unknown>
export type YNode = (YMap | YArr) & { [_meta_]?: Meta; _?: unknown }

export type Owner = MNode | null

export type Meta = {
  mNode: MNode
  yNode: YNode
  owner: Owner
  unobserve?: () => void
}

export class StateNode extends $exSw.Unit {
  private $state = this.up($exSw.State)!
  private $units = this.up($exSw.States)!.units
  private static _meta_ = _meta_
  private static _keys_ = _keys_

  static getOwner<T extends MNode>(target: T) {
    return this.prototype.getOwner(target)
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
      if (!meta.unobserve) throw this.never
      meta.unobserve()
      delete meta.mNode[_meta_]
      delete meta.yNode[_meta_]
      delete meta.mNode._
      delete meta.yNode._
      delete meta.mNode.__
      if (isUnit) this.$units.cleanup(target)
    }

    if (isUnit) {
      for (const key of this.$units.getKeys(target)) {
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

  getOwner<T extends MNode>(node: T): Owner {
    const meta = this.getMeta(node)
    if (!meta) return null
    return meta.owner
  }

  private getMeta(target: any): Meta | null {
    return (target?.[_meta_] as Meta) ?? null
  }

  private createFromYMap(yMap: YMap, owner: Owner = null) {
    // Check if unit
    const spec = yMap.get('@')
    const isUnit = this.$units.isUnitSpec(spec)

    // Create empty node
    const mNode = isUnit ? this.createEmptyMobxUnit(spec, [...yMap.keys()]) : this.createEmptyMobxObject()

    // Attach node
    this.attach(mNode, yMap, owner)

    // Fill recursively
    for (const key of yMap.keys()) {
      mNode[key] = this.create(yMap.get(key), mNode)
    }

    // Observe node
    this.observe(mNode)

    // Setup unit
    if (isUnit) {
      this.setupUnit(mNode)
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

    // Observe node
    this.observe(mNode)

    return mNode
  }

  private createFromObject(object: Obj, owner: Owner = null) {
    // Check if unit
    const spec = object['@']
    const isUnit = this.$units.isUnitSpec(spec)

    // Create empty node
    const mNode = isUnit ? this.createEmptyMobxUnit(spec, Object.keys(object)) : this.createEmptyMobxObject()
    const yNode = !owner ? this.$state.doc.getMap('root') : new this.$.libs.yjs.Map()

    // Attach node
    this.attach(mNode, yNode, owner)

    // Fill recursively
    for (const key in object) {
      mNode[key] = this.create(object[key], mNode)
      const meta = this.getMeta(mNode[key])
      yNode.set(key, meta?.yNode ?? object[key])
    }

    // Observe node
    this.observe(mNode)

    // Setup unit
    if (isUnit) {
      this.setupUnit(mNode)
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

    // Observe node
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
    const unit = this.$units.createEmptyUnit(spec, keys)
    return unit as unknown as MObj
  }

  private setupUnit(unit: MObj) {
    if (!this.$units.isUnit(unit)) throw this.never

    // Why whenReady? When unit runs versioner, changes should be broadcasted
    // to other peers, but broadcasting is enabled only after the state is ready.
    this.$state.setup.whenReady(() => {
      this.$units.setup(unit)
    })
  }

  private attach(mNode: MNode, yNode: YNode, owner: Owner = null) {
    // Add meta
    const meta: Meta = { mNode, yNode, owner }
    Reflect.defineProperty(mNode, _meta_, { configurable: true, get: () => meta })
    Reflect.defineProperty(yNode, _meta_, { configurable: true, get: () => meta })

    // Add dev helpers
    const mNodeToRaw = () => this.raw(mNode)
    const yNodeToJson = () => yNode.toJSON()
    const mNodeToJs = () => this.$.libs.mobx.toJS(mNode)
    Reflect.defineProperty(mNode, '_', { configurable: true, get: mNodeToRaw })
    Reflect.defineProperty(yNode, '_', { configurable: true, get: yNodeToJson })
    Reflect.defineProperty(mNode, '__', { configurable: true, get: mNodeToJs })
  }

  private observe(mNode: MNode) {
    const meta = this.getMeta(mNode)
    if (!meta) throw this.never
    meta.unobserve = this.$state.observer.observe(mNode, meta.yNode)
  }

  private raw<T>(value: T): T {
    // Should we check for isObservable here? Probably not, because now __ is attached only to
    // observable units. Or still yes, because we don't remove __? Should we remove?
    if (this.$units.isUnit(value)) {
      const object: Obj = {}
      const keys = this.$units.getKeys(value)
      for (const key of keys) {
        object[key] = this.raw((value as Obj)[key])
      }
      return object as T
    }

    if (this.$.is.object(value)) {
      const object: Obj = {}
      for (const key in value) {
        object[key] = this.raw(value[key])
      }
      return object as T
    }

    if (this.$.is.array(value)) {
      return value.map(v => this.raw(v)) as T
    }

    return value
  }
}
