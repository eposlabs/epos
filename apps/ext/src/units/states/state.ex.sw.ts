// TODO: (see dev.gl.ts) problem: when versioner is applied, this 'new' is initialized first, before other messages.
// After reload, it is initialized first.
// this.messages.push(new Message('new')).

// x TODO: why parent is not inside meta? To allow state.value[epos.state.PARENT]
// TODO: isFreshModel -> can this logic be moved to `ATTACH` call?
// TODO: probably call attach not inside mnodechange, but inside proxify ?
// proxify -> attach (?)
// TODO: for sw, do not allow methods on objects

import type { DbName, DbStoreKey, DbStoreName } from 'dropcap/idb'
import type { IArrayWillChange, IArrayWillSplice, IObjectWillChange } from 'mobx'
import type { YArrayEvent, YMapEvent, Array as YjsArray, Map as YjsMap } from 'yjs'

export const _meta_ = Symbol('meta')
export const _parent_ = Symbol('parent')
export const _attach_ = Symbol('attach')
export const _detach_ = Symbol('detach')
export const _versioner_ = Symbol('versioner')

export type Origin = null | 'remote'
export type Location = [DbName, DbStoreName, DbStoreKey]
export type Initial = Obj | Model | (() => Obj | Model)
export type Versioner = Record<number, (state: MObject) => void>
export type Root = { data: MObject & { ':version'?: number } }
export type Model = InstanceType<ModelClass>
export type ModelClass = (new (...args: unknown[]) => unknown) & { [_versioner_]?: Versioner }
export type Parent = MNode | null

// MobX node
export type MObject = Obj & { [_parent_]?: Parent; [_meta_]?: Meta; _?: unknown; __?: unknown }
export type MArray = Arr & { [_parent_]?: Parent; [_meta_]?: Meta; _?: unknown; __?: unknown }
export type MNode = MObject | MArray

// Yjs node
export type YMap = YjsMap<unknown> & { [_meta_]?: Meta; _?: unknown }
export type YArray = YjsArray<unknown> & { [_meta_]?: Meta; _?: unknown }
export type YNode = YMap | YArray

// Meta info attached to every MobX and Yjs node
export type Meta = {
  mNode: MNode
  yNode: YNode
  unwire: () => void
  model: null | { keys: Set<string> } // Present for model nodes
}

// MobX change types
export type MObjectSetChange = Extract<IObjectWillChange<Obj>, { type: 'add' | 'update' }>
export type MObjectRemoveChange = Extract<IObjectWillChange<Obj>, { type: 'remove' }>
export type MArrayUpdateChange = IArrayWillChange<any>
export type MArraySpliceChange = IArrayWillSplice<any>
export type MNodeChange = MObjectSetChange | MObjectRemoveChange | MArrayUpdateChange | MArraySpliceChange

/**
 * #### How Sync Works
 * MobX → Local Yjs → (bus) → Remote Yjs → MobX
 */
export class State extends exSw.Unit {
  static _meta_ = _meta_
  static _parent_ = _parent_
  static _attach_ = _attach_
  static _detach_ = _detach_
  static _versioner_ = _versioner_

  name: string
  private $states = this.closest(exSw.States)!
  private root!: Root
  private doc = new this.$.libs.yjs.Doc()
  private bus: ReturnType<gl.Bus['create']>
  private initial: Initial
  private versioner: Versioner
  private connected = false
  private applyingYjsToMobx = false
  private saveTimeout: number | undefined = undefined
  private SAVE_DELAY = this.$.env.is.dev ? 300 : 300 // TODO: pass delay via args (?)

  get id() {
    return this.location.join('/')
  }

  get data(): Obj {
    return this.root.data
  }

  get location(): Location {
    return [this.$states.dbName, this.$states.dbStoreName, this.name]
  }

  constructor(parent: exSw.Unit, name: string, initial: Initial = {}, versioner: Versioner = {}) {
    super(parent)
    this.name = name
    this.initial = initial
    this.versioner = versioner
    this.bus = this.$.bus.create(`State[${this.id}]`)
    this.save = this.$.utils.enqueue(this.save, this)
  }

  async init() {
    await this.$.peer.mutex(`State.setup[${this.id}]`, () => this.setup())
    if (this.$.env.is.ex) this.bus.on('exConnected', () => true)
  }

  async disconnect() {
    if (!this.connected) return
    this.connected = false
    this.doc.destroy()
    this.bus.dispose()
    await this.save()
  }

  transaction(fn: () => void) {
    this.$.libs.mobx.runInAction(() => {
      this.doc.transact(() => {
        fn()
      })
    })
  }

  async hasExPeer() {
    return !!(await this.bus.send<boolean>('exConnected'))
  }

  private async setup() {
    // Listen for updates from other peers
    const missedUpdates: Uint8Array[] = []
    this.bus.on('update', (update: Uint8Array) => {
      if (this.connected) {
        this.$.libs.yjs.applyUpdate(this.doc, update, 'remote')
      } else {
        missedUpdates.push(update)
      }
    })

    // Load state data
    if (this.$.env.is.sw) {
      const data = await this.$.idb.get<Obj>(...this.location)
      this.root = this.proxify({ data: data ?? {} }, null) as Root
      this.bus.on('swGetDocAsUpdate', () => this.$.libs.yjs.encodeStateAsUpdate(this.doc))
    } else if (this.$.env.is.ex) {
      const docAsUpdate = await this.bus.send<Uint8Array>('swGetDocAsUpdate')
      if (!docAsUpdate) throw this.never()
      this.$.libs.yjs.applyUpdate(this.doc, docAsUpdate, 'remote')
      const yRoot = this.doc.getMap('root')
      this.applyingYjsToMobx = true
      this.root = this.proxify(yRoot, null) as Root
      this.applyingYjsToMobx = false
    }

    // Apply missed updates
    for (const update of missedUpdates) {
      this.$.libs.yjs.applyUpdate(this.doc, update, 'remote')
    }

    // Start local changes broadcaster
    this.doc.on('update', async (update: Uint8Array, origin: Origin) => {
      const isLocalUpdate = origin === null
      if (!isLocalUpdate) return
      await this.bus.send('update', update)
    })

    this.connected = true
    // 5. Set initial state; run state versioner; commit attached & detached nodes
    // this.transaction(() => {
    //   // Initialize initial state or run state versioner
    //   $: (() => {
    //     const versions = this.getVersionsAsc(this.versioner)

    //     // Empty state?
    //     if (Object.keys(this.root.data).length === 0) {
    //       // Set initial state
    //       const initial = this.$.utils.is.function(this.initial) ? this.initial() : this.initial
    //       this.root.data = initial

    //       // State itself is a model? -> Don't use state versioner (model versioner will be used)
    //       if (this.isModelNode(this.root.data)) return

    //       // Set the latest version
    //       if (versions.length === 0) return
    //       this.set(this.root.data, ':version', versions.at(-1))
    //     }

    //     // Non-empty state?
    //     else {
    //       // State itself is a model? -> Don't run state versioner (model versioner will be run)
    //       if (this.isModelNode(this.root.data)) return

    //       // Run state versioner
    //       for (const version of versions) {
    //         if (this.$.utils.is.number(this.root.data[':version']) && this.root.data[':version'] >= version)
    //           continue
    //         if (!this.versioner[version]) throw this.never()
    //         this.versioner[version].call(this.root.data, this.root.data)
    //         this.root.data[':version'] = version
    //       }
    //     }
    //   })()

    //   // Mark state as ready, from now on all changes will be tracked for commit
    //   this.connected = true

    //   // Commit attached & detached nodes
    //   this.commit()
    // })

    // Save changes
    this.saveDebounced()
  }

  // ---------------------------------------------------------------------------
  // PROXIFY / DEPROXIFY
  // ---------------------------------------------------------------------------

  private proxify(value: unknown, parent: Parent) {
    if (value instanceof this.$.libs.yjs.Map) return this.proxifyYMap(value, parent)
    if (value instanceof this.$.libs.yjs.Array) return this.proxifyYArray(value, parent)
    if (this.$.utils.is.object(value)) return this.proxifyObject(value, parent)
    if (this.$.utils.is.array(value)) return this.proxifyArray(value, parent)
    if (this.isSupportedValue(value)) return value
    throw new Error(`Unsupported state value: ${value.constructor.name}`)
  }

  private proxifyYMap(yMap: YMap, parent: Parent) {
    const modelName: unknown = yMap.get('@')
    const Model = this.$.utils.is.string(modelName) ? this.getModelByName(modelName) : null
    this.checkMissingModel(modelName, Model)
    const mObject: MObject = this.$.libs.mobx.observable.object({}, {}, { deep: false })
    this.wire(mObject, yMap, parent, Model)
    yMap.forEach((value, key) => (mObject[key] = value))
    if (this.$.utils.is.function(mObject[_attach_])) mObject[_attach_]()
    return mObject
  }

  private proxifyYArray(yArray: YArray, parent: Parent) {
    const mArray: MArray = this.$.libs.mobx.observable.array([], { deep: false })
    this.wire(mArray, yArray, parent, null)
    yArray.forEach(item => mArray.push(item))
    return mArray
  }

  private proxifyObject(object: Obj, parent: Parent) {
    const modelName = object['@']
    const ModelByName = this.$.utils.is.string(modelName) ? this.getModelByName(modelName) : null
    const ModelByInstance = this.getModelByInstance(object)
    const Model = ModelByName ?? ModelByInstance
    this.checkMissingModel(modelName, Model)
    const mObject: MObject = this.$.libs.mobx.observable.object({}, {}, { deep: false })
    const yMap = !parent ? this.doc.getMap('root') : new this.$.libs.yjs.Map()
    this.wire(mObject, yMap, parent, Model, !!ModelByInstance)
    this.getKeys(object).forEach(key => (mObject[key] = object[key]))
    if (this.$.utils.is.function(mObject[_attach_])) mObject[_attach_]()
    return mObject
  }

  private proxifyArray(array: Arr, parent: Parent) {
    const mArray: MArray = this.$.libs.mobx.observable.array([], { deep: false })
    const yArray = new this.$.libs.yjs.Array()
    this.wire(mArray, yArray, parent, null)
    array.forEach(item => mArray.push(item))
    return mArray
  }

  private deproxify(value: unknown): unknown {
    if (this.$.utils.is.object(value)) {
      const object: Obj = {}
      this.getKeys(object).forEach(key => (object[key] = this.deproxify(object[key])))
      return object
    } else if (this.$.utils.is.array(value)) {
      return value.map(item => this.deproxify(item))
    } else {
      return value
    }
  }

  // ---------------------------------------------------------------------------
  // WIRE
  // ---------------------------------------------------------------------------

  private wire(mNode: MNode, yNode: YNode, parent: Parent, Model: ModelClass | null, isFreshModel = false) {
    // Start node observers
    const unobserveMNode = this.$.libs.mobx.intercept(mNode, this.onMNodeChange as any)
    yNode.observe(this.onYNodeChange)

    // Define unwire method
    const unwire = () => {
      // Stop node observers
      unobserveMNode()
      yNode.unobserve(this.onYNodeChange)

      // Delete meta reference
      delete mNode[_meta_]
      delete yNode[_meta_]

      // Delete parent reference
      delete mNode[_parent_]

      // Delete dev helpers
      delete mNode._
      delete yNode._
      delete mNode.__
    }

    // Define meta
    const meta: Meta = { mNode, yNode, isModel: !!Model, unwire }
    Reflect.defineProperty(mNode, _meta_, { configurable: true, get: () => meta })
    Reflect.defineProperty(yNode, _meta_, { configurable: true, get: () => meta })

    // Define parent. Do not store parent in meta, to allow `state.value[epos.state.PARENT]` access.
    Reflect.defineProperty(mNode, _parent_, { configurable: true, get: () => parent })

    // Define dev helpers
    // TODO: deproxify should skeep getters (or maybe not(?), maybe __ should skeep getters)
    Reflect.defineProperty(mNode, '_', { configurable: true, get: () => this.deproxify(mNode) })
    Reflect.defineProperty(yNode, '_', { configurable: true, get: () => yNode.toJSON() })
    Reflect.defineProperty(mNode, '__', { configurable: true, get: () => this.$.libs.mobx.toJS(mNode) })

    // Setup model
    if (Model) {
      // Apply model prototype
      if (!this.$.utils.is.object(mNode)) throw this.never()
      Reflect.setPrototypeOf(mNode, Model.prototype)

      // Set '@' and ':version' fields if this is a fresh model instance
      // TODO: why not just `'@' in mNode?`
      if (isFreshModel) {
        const name = this.getModelName(Model)
        if (this.$.utils.is.undefined(name)) throw this.never()
        mNode['@'] = name
        const versions = this.getVersionsAsc(Model[_versioner_] ?? {})
        if (versions.length > 0) mNode[':version'] = versions.at(-1)
      }
    }
  }

  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //
  //

  private detach(target: unknown) {
    // Not attached? -> Skip
    if (!this.isAttached(target)) return

    // Detach mObject and all its children
    if (this.$.utils.is.object(target)) {
      this.getKeys(target).forEach(key => this.detach(target[key]))
      if (this.$.utils.is.function(target[_detach_])) target[_detach_]()
    }

    // Detach mArray and all its children
    else if (this.$.utils.is.array(target)) {
      target.forEach(item => this.detach(item))
    }
  }

  // ---------------------------------------------------------------------------
  // MOBX CHANGE HANDLERS
  // ---------------------------------------------------------------------------

  private onMNodeChange = (change: MNodeChange) => {
    // Process 'change' object:
    // - Create nodes for new values
    // - Detach removed values
    // - Update corresponding yNode
    if (this.isMObjectChange(change)) {
      // - object[newKey] = value (add)
      // - object[existingKey] = value (update)
      if (change.type === 'add' || change.type === 'update') {
        const prevent = this.processMObjectSet(change)
        if (prevent) return
      }
      // - delete object[key]
      else if (change.type === 'remove') {
        this.processMObjectRemove(change)
      }
    } else {
      // - array[existingIndex] = value
      if (change.type === 'update') {
        this.processMArrayUpdate(change)
      }
      // - array[outOfRangeIndex] = value
      // - array.splice(), array.push(), array.pop(), etc.
      else if (change.type === 'splice') {
        this.processMArraySplice(change)
      }
    }

    // Save state to IDB
    if (this.connected) {
      this.saveDebounced()
    }

    return change
  }

  private processMObjectSet(change: MObjectSetChange) {
    // Skip symbols
    if (this.$.utils.is.symbol(change.name)) return

    // Skip if value didn't change. Also applied for getters (undefined === undefined in this case).
    if (change.newValue === change.object[change.name]) return

    // PREVENT
    // if (this.isUnderscorePrefixed(change.name)) {
    // }
    // if (this.$.utils.is.function(change.newValue)) {
    // }
    const isLocal = this.$.utils.is.string(change.name) && change.name.startsWith('_')
    const isMethod = this.$.utils.is.object(change.object) && this.$.utils.is.function(change.newValue)
    if (isLocal || isMethod) {
      let value = change.newValue
      Reflect.defineProperty(change.object, change.name, {
        configurable: true,
        get: () => value,
        set: (v: unknown) => {
          if (isMethod && !this.$.utils.is.function(v)) {
            throw new Error('Unsupported type')
          } else {
            value = v
          }
        },
      })
      return true
    }

    // Proxify new value
    change.newValue = this.proxify(change.newValue, change.object)

    // Detach old value
    this.detach(change.object[change.name])

    // Update corresponding Yjs node
    if (!this.applyingYjsToMobx) {
      this.doc.transact(() => {
        const yMap = this.getYNode(change.object)
        if (!yMap) throw this.never()
        yMap.set(String(change.name), this.getYNode(change.newValue) ?? change.newValue)
      })
    }
  }

  private processMObjectRemove(change: MObjectRemoveChange) {
    // Skip symbols
    if (this.$.utils.is.symbol(change.name)) return

    // Detach removed value
    this.detach(change.object[change.name])

    // Update corresponding Yjs node
    if (!this.applyingYjsToMobx) {
      this.doc.transact(() => {
        const yMap = this.getYNode(change.object)!
        if (!yMap) throw this.never()
        yMap.delete(String(change.name))
      })
    }
  }

  private processMArrayUpdate(change: MArrayUpdateChange) {
    // Attach new value
    change.newValue = this.proxify(change.newValue, change.object)
    // if (change.newValue._) console.warn('attach', change.newValue._)

    // Detach old value
    this.detach(change.object[change.index])

    // Update corresponding Yjs node
    if (!this.applyingYjsToMobx) {
      this.doc.transact(() => {
        const yArray = this.getYNode(change.object)
        if (!yArray) throw this.never()
        yArray.delete(change.index)
        yArray.insert(change.index, [this.getYNode(change.newValue) ?? change.newValue])
      })
    }
  }

  private processMArraySplice(change: MArraySpliceChange) {
    // Attach added items
    change.added = change.added.map(item => {
      const proxy = this.proxify(item, change.object)
      // if (proxy._) console.warn('attach', proxy._)
      // console.log('!!', proxy[_parent_][_parent_].preview)
      return proxy
    })

    // Detach removed items
    for (let i = change.index; i < change.index + change.removedCount; i++) {
      this.detach(change.object[i])
    }

    // Update corresponding Yjs node
    if (!this.applyingYjsToMobx) {
      this.doc.transact(() => {
        const yArray = this.getYNode(change.object)
        if (!yArray) throw this.never()
        const yAdded = change.added.map((value, index) => this.getYNode(change.added[index]) ?? value)
        yArray.delete(change.index, change.removedCount)
        yArray.insert(change.index, yAdded)
      })
    }
  }

  private isMObjectChange(change: MNodeChange): change is MObjectSetChange | MObjectRemoveChange {
    return this.$.utils.is.object(change.object)
  }

  // ---------------------------------------------------------------------------
  // YJS CHANGE HANDLERS
  // ---------------------------------------------------------------------------

  private onYNodeChange = async (e: YMapEvent<unknown> | YArrayEvent<unknown>) => {
    // Ignore local changes
    if (e.transaction.origin !== 'remote') return

    // Apply remote changes
    if (e instanceof this.$.libs.yjs.YMapEvent) {
      this.applyYMapChange(e)
    } else {
      this.applyYArrayChange(e)
    }
  }

  private applyYMapChange(e: YMapEvent<unknown>) {
    // Get corresponding MobX node
    const yMap = e.target
    const mObject = this.getMNode(yMap)
    if (!mObject) throw this.never()

    // Apply Yjs changes to MobX node
    this.$.libs.mobx.runInAction(() => {
      this.applyingYjsToMobx = true

      for (const key of e.keysChanged) {
        this.detach(mObject[key])
        if (yMap.has(key)) {
          mObject[key] = yMap.get(key)
        } else {
          delete mObject[key]
        }
      }

      this.applyingYjsToMobx = false
    })
  }

  private applyYArrayChange(e: YArrayEvent<unknown>) {
    // Get corresponding MobX node
    const yArray = e.target
    const mArray = this.getMNode(yArray)
    if (!mArray) throw this.never()

    // Apply Yjs changes to MobX node
    this.$.libs.mobx.runInAction(() => {
      this.applyingYjsToMobx = true

      let offset = 0
      for (const operation of e.delta) {
        if (operation.retain) {
          offset += operation.retain
        } else if (operation.delete) {
          for (let i = offset; i < offset + operation.delete; i++) this.detach(mArray[i])
          mArray.splice(offset, operation.delete)
        } else if (operation.insert) {
          if (!this.$.utils.is.array(operation.insert)) throw this.never()
          mArray.splice(offset, 0, ...operation.insert)
          offset += operation.insert.length
        }
      }

      this.applyingYjsToMobx = false
    })
  }

  // ---------------------------------------------------------------------------
  // MODEL MANAGEMENT
  // ---------------------------------------------------------------------------

  private checkMissingModel(modelName: unknown, Model: ModelClass | null) {
    if (this.$.env.is.sw) return
    if (this.$states.config.allowMissingModels) return
    const isMissing = this.$.utils.is.string(modelName) && !Model
    if (!isMissing) return

    throw new Error(
      `Missing model: '${modelName}'. ` +
        'Make sure the model is registered via `epos.state.register` before calling `epos.state.connect`. ' +
        'To allow missing models, set `config.allowMissingModels = true` in epos.json.',
    )
  }

  private runModelVersioner(model: MObject) {
    const Model = this.getModelByInstance(model)
    if (!Model) throw this.never()

    // No versions? -> Ignore
    if (!Model[_versioner_]) return
    const versions = this.getVersionsAsc(Model[_versioner_])
    if (versions.length === 0) return

    // Save current values
    const valuesBefore = { ...model }

    // Get keys before versioner
    const keysBefore = new Set(Object.keys(model))

    // Run versioner
    for (const version of versions) {
      if (this.$.utils.is.number(model[':version']) && model[':version'] >= version) continue
      if (!Model[_versioner_][version]) throw this.never()
      Model[_versioner_][version].call(model, model)
      model[':version'] = version
    }

    // Get keys after versioner
    const keysAfter = new Set(Object.keys(model))

    // Notify MobX about deleted keys
    for (const key of keysBefore) {
      if (keysAfter.has(key)) continue
      // Manually detach old values. Detach won't happen automatically, because inside versioner,
      // we delete fields with `delete model[key]` while `mobx.remove` is required for auto-detection.
      this.detach(valuesBefore[key])
      model[key] = null // Required for MobX to detect change inside 'delete' below
      this.delete(model, key)
    }

    // Notify MobX about added keys
    for (const key of keysAfter) {
      if (keysBefore.has(key)) continue
      const value = model[key]
      delete model[key] // Required for MobX to detect change inside 'set' below
      this.set(model, key, value)
    }
  }

  private runModelMethod(model: MObject, method: PropertyKey) {
    if (!this.$.utils.is.function(model[method])) return
    model[method]()
  }

  // ---------------------------------------------------------------------------
  // PERSISTENCE
  // ---------------------------------------------------------------------------

  private async save() {
    if (!this.$.env.is.sw) return
    self.clearTimeout(this.saveTimeout)
    const data = this.deproxify(this.root.data)
    const [_, error] = await this.$.utils.safe(this.$.idb.set(...this.location, data))
    if (error) this.log.error('Failed to save state to IndexedDB', error)
  }

  private saveDebounced() {
    if (!this.$.env.is.sw) return
    self.clearTimeout(this.saveTimeout)
    this.saveTimeout = self.setTimeout(() => this.save(), this.SAVE_DELAY)
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private delete(mObject: MObject, key: string) {
    this.$.libs.mobx.remove(mObject, key)
  }

  private getMeta(target: any): Meta | null {
    return (target?.[_meta_] as Meta) ?? null
  }

  private isAttached(value: unknown) {
    return !!this.getMeta(value)
  }

  private getMNode<T extends YNode>(yNode: T) {
    const meta = this.getMeta(yNode)
    if (!meta) return null
    return meta.mNode as T extends YMap ? MObject : MArray
  }

  private getYNode<T extends MNode>(mNode: T) {
    const meta = this.getMeta(mNode)
    if (!meta) return null
    return meta.yNode as T extends MObject ? YMap : YArray
  }

  private isSupportedValue(value: unknown) {
    return (
      this.$.utils.is.object(value) ||
      this.$.utils.is.array(value) ||
      this.$.utils.is.string(value) ||
      this.$.utils.is.number(value) ||
      this.$.utils.is.boolean(value) ||
      this.$.utils.is.null(value) ||
      this.$.utils.is.undefined(value)
    )
  }

  private isModelNode(mNode: MNode): mNode is MObject & { __model: true } {
    // TODO: seems like better approach is to check if model.constructor !== Object
    const meta = this.getMeta(mNode)
    if (!meta) throw this.never()
    return meta.isModel
  }

  private getModelByName(name: unknown) {
    if (!this.$.utils.is.string(name)) return null
    return this.$states.models[name] ?? null
  }

  private getModelByInstance(instance: Obj) {
    if (instance.constructor === Object) return null
    return (
      Object.values(this.$states.models).find(Model => instance.constructor === Model) ||
      Object.values(this.$states.models).find(Model => Model.prototype instanceof instance.constructor) ||
      null
    )
  }

  private getModelName(Model: ModelClass) {
    return Object.keys(this.$states.models).find(name => this.$states.models[name] === Model) ?? null
  }

  private getVersionsAsc(versioner: Versioner) {
    return Object.keys(versioner)
      .map(Number)
      .sort((v1, v2) => v1 - v2)
  }

  private getKeys(object: Obj) {
    return Reflect.ownKeys(object).filter(key => object.propertyIsEnumerable(key))
  }
}

// private commit() {
//   // @ts-ignore
//   const pretty = nodes => {
//     return [...nodes].filter(n => this.isModelNode(n)).map(a => a._)
//   }

//   // TOP-LEVEL
//   if (!this.committing) {
//     this.committing = true

//     // @ts-ignore
//     this.topLevelPhase = 'model-versioner'
//     // @ts-ignore
//     this.topLevelInitQueue = new Set(this.attachedNodes)
//     // this.initialized = new Set()
//     // console.warn(pretty(this.topLevelInitQueue))

//     const attachedNodes = new Set(this.attachedNodes)
//     this.attachedNodes.clear()

//     for (const node of attachedNodes) {
//       if (this.isModelNode(node)) {
//         // console.log('[versioner:0]', node._)
//         this.runModelVersioner(node)
//       }
//     }

//     // @ts-ignore
//     this.topLevelPhase = 'model-init'
//     // console.warn(pretty(this.topLevelInitQueue))
//     // @ts-ignore
//     for (const node of this.topLevelInitQueue) {
//       if (this.detachedNodes.has(node)) continue
//       if (this.isModelNode(node)) {
//         // console.log('[init:0]', node._)
//         const meta = this.getMeta(node)
//         // @ts-ignore
//         meta.initialized = true
//         this.runModelMethod(node, _attach_)
//       }
//     }

//     for (const node of this.detachedNodes) {
//       if (this.isModelNode(node)) {
//         const meta = this.getMeta(node)
//         // @ts-ignore
//         if (!meta.initialized) continue
//         // console.log('[dispose]', node._)
//         this.runModelMethod(node, _detach_)
//       }
//     }

//     for (const node of this.detachedNodes) {
//       const meta = this.getMeta(node)
//       if (!meta) throw this.never()
//       meta.unwire()
//     }

//     // @ts-ignore
//     this.initialized = new Set()
//     this.committing = false
//     this.detachedNodes.clear()
//   }

//   // NESTED
//   else {
//     const newNodes = new Set(this.attachedNodes)
//     this.attachedNodes.clear()

//     for (const node of newNodes) {
//       if (this.isModelNode(node)) {
//         // @ts-ignore
//         if (this.topLevelPhase === 'model-versioner') {
//           // console.log('[versioner]', node._)
//           this.runModelVersioner(node)
//           // @ts-ignore
//           this.topLevelInitQueue = new Set([node, ...Array.from(this.topLevelInitQueue)])
//         }

//         // @ts-ignore
//         else if (this.topLevelPhase === 'model-init') {
//           // console.log('[versioner]', node._)
//           this.runModelVersioner(node)
//         }
//       }
//     }

//     // @ts-ignore
//     if (this.topLevelPhase === 'model-init') {
//       for (const node of newNodes) {
//         if (this.isModelNode(node)) {
//           // console.log('[init]', node._)
//           // this.initialized.add(node)
//           const meta = this.getMeta(node)
//           // @ts-ignore
//           meta.initialized = true
//           this.runModelMethod(node, _attach_)
//         }
//       }
//     }
//   }
// }
