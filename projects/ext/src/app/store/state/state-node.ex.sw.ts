import type { Array as YjsArray, Map as YjsMap } from 'yjs'
import type { Schema } from './state.ex.sw'

export const _meta_ = Symbol('meta')
export const _keys_ = Symbol('keys')
export const _local_ = Symbol('local')

// MobX node
export type MObj = Obj & { [_meta_]?: Meta; _?: unknown; __?: unknown }
export type MArr = Arr & { [_meta_]?: Meta; _?: unknown; __?: unknown }
export type MNode = MObj | MArr

// Yjs node
export type YMap = YjsMap<unknown> & { [_meta_]?: Meta; _?: unknown }
export type YArr = YjsArray<unknown> & { [_meta_]?: Meta; _?: unknown }
export type YNode = YMap | YArr

export type Owner = MNode | null

export type Meta = {
  mNode: MNode
  yNode: YNode
  owner: Owner
  keys: Set<string> // Always empty for array nodes
  detach?: () => void
  unobserve?: () => void
}

export class StateNode extends $exSw.Unit {
  private $state = this.up($exSw.State)!

  static getOwner<T extends MNode>(target: T) {
    return this.prototype.getOwner(target)
  }

  create(target: YMap, owner?: Owner): MObj
  create(target: YArr, owner?: Owner): MArr
  create(target: Obj, owner?: Owner): MObj
  create(target: Arr, owner?: Owner): MArr
  create<T>(target: T & (T extends YMap | YArr | Obj | Arr ? never : unknown), owner?: Owner): T
  create<T>(target: T, owner: Owner = null) {
    if (target instanceof this.$.libs.yjs.Map) return this.createFromYMap(target, owner)
    if (target instanceof this.$.libs.yjs.Array) return this.createFromYArray(target, owner)
    if (this.$.is.object(target)) return this.createFromObject(target, owner)
    if (this.$.is.array(target)) return this.createFromArray(target, owner)
    return target
  }

  detach(target: unknown) {
    const meta = this.getMeta(target)
    if (meta) {
      if (!meta.unobserve) throw this.never
      meta.unobserve()
      meta.detach?.()
      delete meta.mNode[_meta_]
      delete meta.yNode[_meta_]
      delete meta.mNode._
      delete meta.yNode._
      delete meta.mNode.__
    }

    if (this.$.is.object(target)) {
      const keys = this.getObjectKeys(target)
      for (const key of keys) this.detach(target[key])
    } else if (this.$.is.array(target)) {
      for (const item of target) this.detach(item)
    }
  }

  onDetach(target: MObj, fn: Fn) {
    const meta = this.getMeta(target)
    if (!meta) throw new Error('Target is not observable')
    if (meta.detach) throw new Error('Detach handler is already set')
    meta.detach = fn
  }

  set(node: MObj, key: string, value: unknown) {
    const meta = this.getMeta(node)
    if (!meta) throw this.never
    meta.keys.add(key)
    this.$.libs.mobx.set(node, key, this.create(value, node))
  }

  remove(node: MObj, key: string) {
    const meta = this.getMeta(node)
    if (!meta) throw this.never
    meta.keys.delete(key)
    this.$.libs.mobx.remove(node, key)
  }

  // ---------------------------------------------------------------------------
  // CREATORS
  // ---------------------------------------------------------------------------

  private createFromYMap(yMap: YMap, owner: Owner = null) {
    const mNode = this.createEmptyMobxObject()
    this.setupMeta(mNode, yMap, owner)
    this.setupDevHelpers(mNode, yMap)

    const Schema = this.getSchemaByName(yMap.get('@'))
    if (Schema) this.applySchema(mNode, Schema)

    for (const key of yMap.keys()) {
      this.set(mNode, key, yMap.get(key))
    }

    this.startObserver(mNode)
    return mNode
  }

  private createFromYArray(yArray: YArr, owner: Owner = null) {
    const mNode = this.createEmptyMobxArray()
    this.setupMeta(mNode, yArray, owner)
    this.setupDevHelpers(mNode, yArray)

    for (let i = 0; i < yArray.length; i++) {
      mNode.push(this.create(yArray.get(i), mNode))
    }

    this.startObserver(mNode)
    return mNode
  }

  private createFromObject(object: Obj, owner: Owner = null) {
    const mNode = this.createEmptyMobxObject()
    const yNode = !owner ? this.$state.doc.getMap('root') : new this.$.libs.yjs.Map()
    this.setupMeta(mNode, yNode, owner)
    this.setupDevHelpers(mNode, yNode)

    const Schema = this.getSchemaByName(object['@']) ?? this.getSchemaByInstance(object)
    if (Schema) this.applySchema(mNode, Schema)

    for (const key in object) {
      const value = object[key]
      if (!this.isSafeValue(value)) {
        this.defineProperty(mNode, key, value)
        continue
      }

      this.set(mNode, key, value)
      const itemMeta = this.getMeta(mNode[key])
      yNode.set(key, itemMeta?.yNode ?? value)
    }

    this.startObserver(mNode)
    return mNode
  }

  private createFromArray(array: Arr, owner: Owner = null) {
    const mNode = this.createEmptyMobxArray()
    const yNode = new this.$.libs.yjs.Array()
    this.setupMeta(mNode, yNode, owner)
    this.setupDevHelpers(mNode, yNode)

    for (const item of array) {
      if (!this.isSafeValue(item)) {
        this.log.error('Unsupported array item', item)
        throw new Error('Unsupported array item')
      }

      mNode.push(this.create(item, mNode))
      const itemMeta = this.getMeta(mNode.at(-1))
      yNode.insert(mNode.length - 1, [itemMeta?.yNode ?? item])
    }

    this.startObserver(mNode)
    return mNode
  }

  // ---------------------------------------------------------------------------
  // MISC
  // ---------------------------------------------------------------------------

  private getMeta(target: any): Meta | null {
    return (target?.[_meta_] as Meta) ?? null
  }

  getMNode<T extends YNode>(yNode: T) {
    const meta = this.getMeta(yNode)
    if (!meta) return null
    return meta.mNode as T extends YMap ? MObj : MArr
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

  unwrap<T>(value: T): T {
    if (this.$.is.object(value)) {
      const keys = this.getObjectKeys(value)
      const object: Obj = {}
      for (const key of keys) object[key] = this.unwrap((value as Obj)[key])
      return object as T
    }

    if (this.$.is.array(value)) {
      return value.map(item => this.unwrap(item)) as T
    }

    return value
  }

  private createEmptyMobxObject() {
    const object: MObj = {}
    this.$.libs.mobx.makeObservable(object)
    return object
  }

  private createEmptyMobxArray() {
    const array: MArr = this.$.libs.mobx.observable.array([], { deep: false })
    return array
  }

  private setupMeta(mNode: MNode, yNode: YNode, owner: Owner) {
    const meta: Meta = { mNode, yNode, owner, keys: new Set() }
    Reflect.defineProperty(mNode, _meta_, { configurable: true, get: () => meta })
    Reflect.defineProperty(yNode, _meta_, { configurable: true, get: () => meta })
    return meta
  }

  private setupDevHelpers(mNode: MNode, yNode: YNode) {
    Reflect.defineProperty(mNode, '_', { configurable: true, get: () => this.unwrap(mNode) })
    Reflect.defineProperty(yNode, '_', { configurable: true, get: () => yNode.toJSON() })
    Reflect.defineProperty(mNode, '__', { configurable: true, get: () => this.$.libs.mobx.toJS(mNode) })
  }

  private applySchema(mObj: MObj, Schema: Schema) {
    const schemaName = this.getSchemaName(Schema)
    if (!schemaName) throw this.never
    this.set(mObj, '@', schemaName)
    Reflect.setPrototypeOf(mObj, Schema.prototype)
  }

  private startObserver(mNode: MNode) {
    const meta = this.getMeta(mNode)
    if (!meta) throw this.never
    meta.unobserve = this.$state.observer.observe(mNode, meta.yNode)
  }

  private getSchemaByName(name: unknown) {
    if (!this.$.is.string(name)) return null
    return this.$state.schemas[name] ?? null
  }

  private getSchemaByInstance(instance: Obj) {
    return Object.values(this.$state.schemas).find(Schema => instance instanceof Schema)
  }

  private getSchemaName(Schema: Schema) {
    return Object.keys(this.$state.schemas).find(name => this.$state.schemas[name] === Schema) ?? null
  }

  private defineProperty(target: object, key: string | symbol, value: unknown) {
    Reflect.defineProperty(target, key, {
      configurable: true,
      get: () => value,
      set: v => (value = v),
    })
  }

  private getObjectKeys(value: Obj) {
    const meta = this.getMeta(value)
    if (meta) return meta.keys
    return Object.keys(value)
  }

  private isSafeValue(value: unknown) {
    return (
      this.$.is.undefined(value) ||
      this.$.is.null(value) ||
      this.$.is.boolean(value) ||
      this.$.is.number(value) ||
      this.$.is.string(value) ||
      this.$.is.array(value) ||
      (this.$.is.object(value) && !value[_local_])
    )
  }
}
