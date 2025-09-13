import type { Array as YjsArray, Map as YjsMap } from 'yjs'
import type { Value } from './state.ex.sw'
import { _local_, _exclude_ } from '../states.ex.sw'

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
  static _meta_ = _meta_
  static _keys_ = _keys_

  static getOwner<T extends MNode>(target: T) {
    return this.prototype.getOwner(target)
  }

  isSupported(target: unknown) {
    return (
      (this.$.is.object(target) && !target[_local_] && !target[_exclude_]) ||
      this.$.is.array(target) ||
      this.isSupportedPrimitive(target)
    )
  }

  create(target: YMap, owner?: Owner): MObj
  create(target: YArr, owner?: Owner): MArr
  create(target: Obj, owner?: Owner): MObj
  create(target: Arr, owner?: Owner): MArr
  create<T extends Value>(target: T, owner?: Owner): T
  create<T extends unknown>(target: T, owner?: Owner): never
  create<T>(target: T, owner: Owner = null) {
    // Create from Yjs map
    if (target instanceof this.$.libs.yjs.Map) {
      return this.createFromYMap(target, owner)
    }

    // Create from Yjs array
    if (target instanceof this.$.libs.yjs.Array) {
      return this.createFromYArray(target, owner)
    }

    // Create from object
    if (this.$.is.object(target)) {
      return this.createFromObject(target, owner)
    }

    // Create from array
    if (this.$.is.array(target)) {
      return this.createFromArray(target, owner)
    }

    // Supported primitive? -> Use as is
    if (this.isSupportedPrimitive(target)) {
      return target
    }

    throw new Error('No-supported')

    // Throw for unsupported types
    // console.error(`Unsupported value for state:`, target)
    // throw new Error('Unsupported value')
  }

  detach(target: unknown) {
    const meta = this.getMeta(target)
    const isObservableUnit = this.$.units.isObservableUnit(target)

    if (meta) {
      if (!meta.unobserve) throw this.never
      meta.unobserve()
      delete meta.mNode[_meta_]
      delete meta.yNode[_meta_]
      delete meta.mNode._
      delete meta.yNode._
      delete meta.mNode.__
      if (isObservableUnit) this.$.units.cleanup(target)
    }

    // Detach unit
    if (isObservableUnit) {
      const keys = this.$.units.getObservableKeys(target)
      for (const key of keys) {
        this.detach((target as any)[key])
      }
    }

    // Detach object
    else if (this.$.is.object(target)) {
      for (const key in target) {
        this.detach(target[key])
      }
    }

    // Detach array
    else if (this.$.is.array(target)) {
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

  getYNode<T extends MNode>(mNode: T) {
    const meta = this.getMeta(mNode)
    if (!meta) return null
    return meta.yNode as T extends MObj ? YMap : YArr
  }

  getOwner<T extends MNode | YNode>(node: T): Owner {
    const meta = this.getMeta(node)
    if (!meta) return null
    return meta.owner
  }

  raw<T>(value: T): T {
    if (this.$.units.isObservableUnit(value)) {
      const object: Obj = {}
      const keys = this.$.units.getObservableKeys(value)
      for (const key of keys) object[key] = this.raw((value as Obj)[key])
      return object as T
    }

    if (this.$.is.object(value)) {
      if (value[_keys_]) {
        const object: Obj = {}
        for (const key of value[_keys_]) object[key] = this.raw((value as Obj)[key])
        return object as T
      }
      const object: Obj = {}
      for (const key in value) object[key] = this.raw(value[key])
      return object as T
    }

    if (this.$.is.array(value)) {
      return value.map(item => this.raw(item)) as T
    }

    return value
  }

  private getMeta(target: any): Meta | null {
    return (target?.[_meta_] as Meta) ?? null
  }

  private createFromYMap(yMap: YMap, owner: Owner = null) {
    // Check if unit
    const spec = yMap.get('@')
    const isUnit = this.$.units.isUnitSpec(this.$state.unitScope, spec)

    // Create empty node
    const keys = [...yMap.keys()]
    const mNode = isUnit ? this.createEmptyMobxUnit(spec, keys) : this.createEmptyMobxObject()

    // Attach node
    this.attach(mNode, yMap, owner)

    // Fill recursively
    for (const key of keys) {
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
    const isUnit = this.$.units.isUnitSpec(this.$state.unitScope, spec)

    // Create empty node
    const mNode = isUnit ? this.createEmptyMobxUnit(spec, Object.keys(object)) : {} //this.createEmptyMobxObject()
    const yNode = !owner ? this.$state.doc.getMap('root') : new this.$.libs.yjs.Map()

    // Attach node
    this.attach(mNode, yNode, owner)

    // Fill recursively
    const annotations = {}
    for (const key in object) {
      if (this.isSupported(object[key])) {
        annotations[key] = this.$.libs.mobx.observable
        mNode[key] = this.create(object[key], mNode)
        const meta = this.getMeta(mNode[key])
        yNode.set(key, meta?.yNode ?? object[key])
      } else {
        let value = object[key]
        Reflect.defineProperty(mNode, key, {
          configurable: true,
          get: () => value,
          set: v => (value = v),
        })
      }
    }

    this.$.libs.mobx.makeObservable(mNode, annotations, { deep: false })
    let kValue = Object.keys(annotations)
    Reflect.defineProperty(mNode, _keys_, {
      configurable: true,
      get: () => kValue,
      set: v => (kValue = v),
    })

    // Observe node
    this.observe(mNode)

    if (object['@']) {
      let Class = this.$.states.units[object['@']]
      if (Class) Reflect.setPrototypeOf(mNode, Class.prototype)
    } else if (object.constructor !== Object) {
      Reflect.setPrototypeOf(mNode, Object.getPrototypeOf(object))
    }

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
    return object as MObj
  }

  private createEmptyMobxArray() {
    const array = this.$.libs.mobx.observable.array([], { deep: false })
    return array as MArr
  }

  private createEmptyMobxUnit(spec: string, keys: string[]) {
    const unit = this.$.units.createEmptyObservableUnit(this.$state.unitScope, spec, keys)
    return unit as unknown as MObj
  }

  private setupUnit(unit: MObj) {
    // Why 'when ready'? When unit runs versioner, changes should be broadcasted to other peers,
    // but broadcasting is enabled only after the state is ready.
    this.$state.connector.whenConnected(() => {
      if (!this.$.units.isObservableUnit(unit)) throw this.never
      this.$.units.setup(unit)
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
}
