// TODO: (see dev.gl.ts) problem: when versioner is applied, this 'new' is initialized first, before other messages.
// After reload, it is initialized first.
// this.messages.push(new Message('new')).

import type { IArrayWillChange, IArrayWillSplice, IObjectWillChange } from 'mobx'
import type { YArrayEvent, YMapEvent, Array as YjsArray, Map as YjsMap } from 'yjs'
import type { DbKey, DbName, DbStore } from '../../idb/idb.sw'

export const _meta_ = Symbol('meta')
export const _parent_ = Symbol('parent')
export const _modelInit_ = Symbol('modelInit')
export const _modelCleanup_ = Symbol('modelCleanup')
export const _modelStrict_ = Symbol('modelStrict')
export const _modelVersioner_ = Symbol('modelVersioner')

export type Origin = null | 'remote'
export type Location = [DbName, DbStore, DbKey]
export type Initial = Obj | Model | (() => Obj | Model)
export type Versioner = Record<number, (state: MObject) => void>
export type Root = { data: MObject & { ':version'?: number } }
export type Model = InstanceType<ModelClass>

export type ModelClass = (new (...args: unknown[]) => unknown) & {
  [_modelStrict_]?: boolean
  [_modelVersioner_]?: Versioner
}

export type Config = {
  allowMissingModels?: boolean | string[]
}

// MobX node
export type Parent = MNode | null
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

export type Options = {
  initial?: Initial
  config?: Config
  models?: Record<string, ModelClass>
  versioner?: Versioner
}

/**
 * #### How Sync Works
 * MobX → Local Yjs → (bus) → Remote Yjs → MobX
 */
export class State extends exSw.Unit {
  id: string
  location: Location

  static _meta_ = _meta_
  static _parent_ = _parent_
  static _modelInit_ = _modelInit_
  static _modelCleanup_ = _modelCleanup_
  static _modelStrict_ = _modelStrict_
  static _modelVersioner_ = _modelVersioner_

  private root!: Root
  private config: Config = {}
  private doc = new this.$.libs.yjs.Doc()
  private bus: ReturnType<gl.Bus['create']>
  private models: Record<string, ModelClass>
  private versioner: Versioner
  private initial: Initial
  private connected = false
  private committing = false
  private attachedNodes = new Set<MNode>()
  private detachedNodes = new Set<MNode>()
  private applyingYjsToMobx = false
  private mobxOperationDepth = 0

  private saveQueue = new this.$.utils.Queue()
  private saveTimeout: number | undefined = undefined
  private SAVE_DELAY = this.$.env.is.dev ? 300 : 300 // 2000

  get data(): Obj {
    return this.root.data
  }

  static async create(parent: exSw.Unit, location: Location, options: Options = {}) {
    const state = new State(parent, location, options)
    await state.$.peer.mutex(`state.setup[${state.id}]`, () => state.init())
    return state
  }

  constructor(parent: exSw.Unit, location: Location, options: Options = {}) {
    super(parent)
    this.id = location.join('/')
    this.bus = this.$.bus.create(`state[${this.id}]`)
    this.location = location
    this.config = options.config ?? {}
    this.models = options.models ?? {}
    this.initial = options.initial ?? {}
    this.versioner = options.versioner ?? {}
    this.save = this.saveQueue.wrap(this.save, this)
  }

  async disconnect() {
    if (!this.connected) return
    this.connected = false
    this.doc.destroy()
    this.bus.off('update')
    if (this.$.env.is.sw) this.bus.off('swGetDocAsUpdate')
    await this.save()
  }

  async destroy() {
    await this.disconnect()
    await this.$.idb.delete(...this.location)
  }

  transaction(fn: () => void) {
    this.$.libs.mobx.runInAction(() => {
      this.doc.transact(() => {
        fn()
      })
    })
  }

  setConfig(config: Config) {
    this.config = config
  }

  registerModels(models: Record<string, ModelClass>) {
    Object.assign(this.models, models)
  }

  private async init() {
    // 1. Listen for updates from other peers
    const missedUpdates: Uint8Array[] = []
    this.bus.on('update', (update: Uint8Array) => {
      if (this.connected) {
        this.$.libs.yjs.applyUpdate(this.doc, update, 'remote')
      } else {
        missedUpdates.push(update)
      }
    })

    // 2. Load state data
    if (this.$.env.is.sw) {
      const data = await this.$.idb.get<Obj>(...this.location)
      this.root = this.attach({ data: data ?? {} }, null) as Root
      this.bus.on('swGetDocAsUpdate', () => this.$.libs.yjs.encodeStateAsUpdate(this.doc))
    } else if (this.$.env.is.ex) {
      const docAsUpdate = await this.bus.send<Uint8Array>('swGetDocAsUpdate')
      this.$.libs.yjs.applyUpdate(this.doc, docAsUpdate, 'remote')
      const yRoot = this.doc.getMap('root')
      this.applyingYjsToMobx = true
      this.root = this.attach(yRoot, null) as Root
      this.applyingYjsToMobx = false
    }

    // 3. Apply missed updates
    for (const update of missedUpdates) {
      this.$.libs.yjs.applyUpdate(this.doc, update, 'remote')
    }

    // 4. Start local changes broadcaster
    this.doc.on('update', async (update: Uint8Array, origin: Origin) => {
      const isLocalUpdate = origin === null
      if (!isLocalUpdate) return
      await this.bus.send('update', update)
    })

    // 5. Set initial state. Run state versioner. Commit attached & detached nodes.
    this.transaction(() => {
      // Initialize initial state or run state versioner
      $: (() => {
        const versions = this.getVersionsAsc(this.versioner)

        // Empty state?
        if (Object.keys(this.root.data).length === 0) {
          // Set initial state
          const initial = this.$.is.function(this.initial) ? this.initial() : this.initial
          this.root.data = initial

          // State itself is a model? -> Don't use state versioner (model versioner will be used)
          if (this.isModelNode(this.root.data)) return

          // Set the latest version
          if (versions.length === 0) return
          this.set(this.root.data, ':version', versions.at(-1))
        }

        // Non-empty state?
        else {
          // State itself is a model? -> Don't run state versioner (model versioner will be run)
          if (this.isModelNode(this.root.data)) return

          // Run state versioner
          for (const version of versions) {
            if (this.$.is.number(this.root.data[':version']) && this.root.data[':version'] >= version)
              continue
            this.versioner[version].call(this.root.data, this.root.data)
            this.root.data[':version'] = version
          }
        }
      })()

      // Mark state as ready, from now on all changes will be tracked for commit
      this.connected = true

      // Commit attached & detached nodes
      this.commit()
    })

    // 6. Save changes
    this.saveDebounced()
  }

  // ---------------------------------------------------------------------------
  // ATTACH / DETACH
  // ---------------------------------------------------------------------------

  private attach(source: YMap, parent: Parent): MObject
  private attach(source: YArray, parent: Parent): MArray
  private attach(source: Obj | Model, parent: Parent): MObject
  private attach(source: Arr, parent: Parent): MArray
  private attach<T extends undefined | null | boolean | number | string>(source: T, parent: Parent): T
  private attach<T>(source: T, parent: Parent) {
    if (source instanceof this.$.libs.yjs.Map) {
      const yMap = source
      const modelName: unknown = yMap.get('@')
      const Model = this.$.is.string(modelName) ? this.getModelByName(modelName) : null
      this.checkForMissingModel(Model, modelName, () => yMap.toJSON())
      const useProxy = Model ? !Model[_modelStrict_] : true
      const mObject: MObject = this.$.libs.mobx.observable.object({}, {}, { deep: false, proxy: useProxy })
      this.wire(mObject, yMap, parent, Model)
      yMap.forEach((value, key) => this.set(mObject, key, value))
      this.attachedNodes.add(mObject)
      return mObject
    }

    if (source instanceof this.$.libs.yjs.Array) {
      const yArray = source
      const mArray: MArray = this.$.libs.mobx.observable.array([], { deep: false })
      this.wire(mArray, yArray, parent, null)
      yArray.forEach(item => mArray.push(item))
      this.attachedNodes.add(mArray)
      return mArray
    }

    if (this.$.is.object(source)) {
      const object = source
      const modelName = object['@']
      const ModelByName = this.$.is.string(modelName) ? this.getModelByName(modelName) : null
      const ModelByInstance = this.getModelByInstance(object)
      const Model = ModelByName ?? ModelByInstance
      this.checkForMissingModel(Model, modelName, () => object)
      const useProxy = Model ? !Model[_modelStrict_] : true
      const mObject: MObject = this.$.libs.mobx.observable.object({}, {}, { deep: false, proxy: useProxy })
      const yMap = !parent ? this.doc.getMap('root') : new this.$.libs.yjs.Map()
      this.wire(mObject, yMap, parent, Model, !!ModelByInstance)
      // It is important to use Object.keys instead of for..in, because for..in iterates over prototype properties as well
      // this.keys because object can be observable s.items = [s.items[0]]
      this.keys(object).forEach(key => this.set(mObject, key, object[key]))
      this.attachedNodes.add(mObject)
      return mObject
    }

    if (this.$.is.array(source)) {
      const array = source
      const mArray: MArray = this.$.libs.mobx.observable.array([], { deep: false })
      const yArray = new this.$.libs.yjs.Array()
      this.wire(mArray, yArray, parent, null)
      array.forEach(item => mArray.push(item))
      this.attachedNodes.add(mArray)
      return mArray
    }

    if (
      this.$.is.undefined(source) ||
      this.$.is.null(source) ||
      this.$.is.boolean(source) ||
      this.$.is.number(source) ||
      this.$.is.string(source)
    ) {
      return source
    }

    self.setTimeout(() => {
      console.warn(`[epos] Supported state types: object, array, string, number, boolean, null, undefined.`)
      console.warn('[epos] Invalid value container:', parent)
      console.warn('[epos] Invalid value:', source)
    }, 10)

    let displayValue: string
    if (this.$.is.function(source)) {
      displayValue = 'function'
    } else {
      displayValue = String(source).slice(0, 100)
    }

    throw new Error(`[epos] Unsupported state value: ${displayValue}`)
  }

  private detach(target: unknown) {
    // Detach attached nodes only. Skip regular objects/arrays and other regular values.
    const meta = this.getMeta(target)
    if (!meta) return

    // Detach object node and all its children
    if (this.$.is.object(target)) {
      const keys = this.keys(target)
      for (const key of keys) this.detach(target[key])
      this.detachedNodes.add(target)
    }

    // Detach array node and all its children
    else if (this.$.is.array(target)) {
      for (const item of target) this.detach(item)
      this.detachedNodes.add(target)
    }
  }

  private wire(mNode: MNode, yNode: YNode, parent: Parent, Model: ModelClass | null, isFresh = false) {
    // 1. Start node observers
    const unobserveMNode = this.$.libs.mobx.intercept(mNode, this.onMNodeChange as any)
    yNode.observe(this.onYNodeChange)

    // 2. Define unwire method
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

    // 3. Define meta
    const meta: Meta = { mNode, yNode, unwire, model: Model ? { keys: new Set() } : null }
    Reflect.defineProperty(mNode, _meta_, { configurable: true, get: () => meta })
    Reflect.defineProperty(yNode, _meta_, { configurable: true, get: () => meta })

    // 4. Define parent
    Reflect.defineProperty(mNode, _parent_, { configurable: true, get: () => parent })

    // 5. Define dev helpers
    Reflect.defineProperty(mNode, '_', { configurable: true, get: () => this.unwrap(mNode) })
    Reflect.defineProperty(yNode, '_', { configurable: true, get: () => yNode.toJSON() })
    Reflect.defineProperty(mNode, '__', { configurable: true, get: () => this.$.libs.mobx.toJS(mNode) })

    // 6. Setup model
    if (Model) {
      // Apply model prototype
      if (!this.$.is.object(mNode)) throw this.never
      Reflect.setPrototypeOf(mNode, Model.prototype)

      // Set '@' and ':version' fields if this is a fresh model instance
      if (isFresh) {
        const name = this.getModelName(Model)
        if (this.$.is.undefined(name)) throw this.never
        this.set(mNode, '@', name)
        const versions = this.getVersionsAsc(Model[_modelVersioner_] ?? {})
        if (versions.length > 0) this.set(mNode, ':version', versions.at(-1))
      }
    }
  }

  private commit() {
    // @ts-ignore
    const pretty = nodes => {
      return [...nodes].filter(n => this.isModelNode(n)).map(a => a._)
    }

    // TOP-LEVEL
    if (!this.committing) {
      this.committing = true

      // @ts-ignore
      this.topLevelPhase = 'model-versioner'
      // @ts-ignore
      this.topLevelInitQueue = new Set(this.attachedNodes)
      // this.initialized = new Set()
      // console.warn(pretty(this.topLevelInitQueue))

      const attachedNodes = new Set(this.attachedNodes)
      this.attachedNodes.clear()

      for (const node of attachedNodes) {
        if (this.isModelNode(node)) {
          // console.log('[versioner:0]', node._)
          this.runModelVersioner(node)
        }
      }

      // @ts-ignore
      this.topLevelPhase = 'model-init'
      // console.warn(pretty(this.topLevelInitQueue))
      // @ts-ignore
      for (const node of this.topLevelInitQueue) {
        if (this.detachedNodes.has(node)) continue
        if (this.isModelNode(node)) {
          // console.log('[init:0]', node._)
          const meta = this.getMeta(node)
          // @ts-ignore
          meta.initialized = true
          this.runModelMethod(node, _modelInit_)
        }
      }

      for (const node of this.detachedNodes) {
        if (this.isModelNode(node)) {
          const meta = this.getMeta(node)
          // @ts-ignore
          if (!meta.initialized) continue
          // console.log('[cleanup]', node._)
          this.runModelMethod(node, _modelCleanup_)
        }
      }

      for (const node of this.detachedNodes) {
        const meta = this.getMeta(node)
        if (!meta) throw this.never
        meta.unwire()
      }

      // @ts-ignore
      this.initialized = new Set()
      this.committing = false
      this.detachedNodes.clear()
    }

    // NESTED
    else {
      const newNodes = new Set(this.attachedNodes)
      this.attachedNodes.clear()

      for (const node of newNodes) {
        if (this.isModelNode(node)) {
          // @ts-ignore
          if (this.topLevelPhase === 'model-versioner') {
            // console.log('[versioner]', node._)
            this.runModelVersioner(node)
            // @ts-ignore
            this.topLevelInitQueue = new Set([node, ...Array.from(this.topLevelInitQueue)])
          }

          // @ts-ignore
          else if (this.topLevelPhase === 'model-init') {
            // console.log('[versioner]', node._)
            this.runModelVersioner(node)
          }
        }
      }

      // @ts-ignore
      if (this.topLevelPhase === 'model-init') {
        for (const node of newNodes) {
          if (this.isModelNode(node)) {
            // console.log('[init]', node._)
            // this.initialized.add(node)
            const meta = this.getMeta(node)
            // @ts-ignore
            meta.initialized = true
            this.runModelMethod(node, _modelInit_)
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // MOBX CHANGE HANDLERS
  // ---------------------------------------------------------------------------

  private onMNodeChange = (change: MNodeChange) => {
    // When connected, track MobX operation depth. When the depth reaches 0 at the end of a change,
    // it means the entire operation has completed. After this, attach/detach queues are committed.
    if (this.connected) {
      this.mobxOperationDepth += 1
    }

    // Process 'change' object:
    // - Create nodes for new values
    // - Detach removed values
    // - Update corresponding yNode
    if (this.isMObjectChange(change)) {
      // - object[newKey] = value (add)
      // - object[existingKey] = value (update)
      if (change.type === 'add' || change.type === 'update') {
        this.applyMObjectSet(change)
      }
      // - delete object[key]
      else if (change.type === 'remove') {
        this.applyMObjectRemove(change)
      }
    } else {
      // - array[existingIndex] = value
      if (change.type === 'update') {
        this.applyMArrayUpdate(change)
      }
      // - array[outOfRangeIndex] = value
      // - array.splice(), array.push(), array.pop(), etc.
      else if (change.type === 'splice') {
        this.applyMArraySplice(change)
      }
    }

    if (this.connected) {
      // Save state to IDB
      this.saveDebounced()

      // Commit attach/detach queues when the entire operation has completed
      this.mobxOperationDepth -= 1
      if (this.mobxOperationDepth === 0) this.commit()
    }

    return change
  }

  private applyMObjectSet(c: MObjectSetChange) {
    // Skip symbols
    if (this.$.is.symbol(c.name)) return

    // Skip if value hasn't changed.
    // Also applied for getters (undefined === undefined in this case).
    if (c.newValue === c.object[c.name]) return

    // Attach new value
    c.newValue = this.attach(c.newValue, c.object)

    // Detach old value
    this.detach(c.object[c.name])

    // Update corresponding Yjs node
    if (this.applyingYjsToMobx) return
    this.doc.transact(() => {
      const yMap = this.getYNode(c.object)
      if (!yMap) throw this.never
      yMap.set(String(c.name), this.getYNode(c.newValue) ?? c.newValue)
    })
  }

  private applyMObjectRemove(c: MObjectRemoveChange) {
    // Skip symbols
    if (this.$.is.symbol(c.name)) return

    // Detach removed value
    this.detach(c.object[c.name])

    // Update corresponding Yjs node
    if (this.applyingYjsToMobx) return
    this.doc.transact(() => {
      const yMap = this.getYNode(c.object)!
      if (!yMap) throw this.never
      yMap.delete(String(c.name))
    })
  }

  private applyMArrayUpdate(c: MArrayUpdateChange) {
    // Attach new value
    c.newValue = this.attach(c.newValue, c.object)

    // Detach old value
    this.detach(c.object[c.index])

    // Update corresponding Yjs node
    if (this.applyingYjsToMobx) return
    this.doc.transact(() => {
      const yArray = this.getYNode(c.object)
      if (!yArray) throw this.never
      yArray.delete(c.index)
      yArray.insert(c.index, [this.getYNode(c.newValue) ?? c.newValue])
    })
  }

  private applyMArraySplice(c: MArraySpliceChange) {
    // Attach added items
    c.added = c.added.map(item => this.attach(item, c.object))

    // Detach removed items
    for (let i = c.index; i < c.index + c.removedCount; i++) this.detach(c.object[i])

    // Update corresponding Yjs node
    if (this.applyingYjsToMobx) return
    this.doc.transact(() => {
      const yArray = this.getYNode(c.object)
      if (!yArray) throw this.never
      const yAdded = c.added.map((value, index) => this.getYNode(c.added[index]) ?? value)
      yArray.delete(c.index, c.removedCount)
      yArray.insert(c.index, yAdded)
    })
  }

  private isMObjectChange(change: MNodeChange): change is MObjectSetChange | MObjectRemoveChange {
    return this.$.is.object(change.object)
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
    if (!mObject) throw this.never

    // Apply Yjs changes to MobX node
    this.$.libs.mobx.runInAction(() => {
      this.applyingYjsToMobx = true

      for (const key of e.keysChanged) {
        this.detach(mObject[key])
        if (yMap.has(key)) {
          this.set(mObject, key, yMap.get(key))
        } else {
          this.delete(mObject, key)
        }
      }

      this.applyingYjsToMobx = false
    })
  }

  private applyYArrayChange(e: YArrayEvent<unknown>) {
    // Get corresponding MobX node
    const yArray = e.target
    const mArray = this.getMNode(yArray)
    if (!mArray) throw this.never

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
          if (!this.$.is.array(operation.insert)) throw this.never
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

  private checkForMissingModel(Model: ModelClass | null, modelName: unknown, getValue: () => unknown) {
    if (this.$.env.is.sw) return
    if (Model) return
    if (!this.$.is.string(modelName)) return

    const { allowMissingModels } = this.config
    if (allowMissingModels === true) return
    if (this.$.is.array(allowMissingModels) && allowMissingModels.includes(modelName)) return

    self.setTimeout(() => {
      console.warn(
        '[epos] Make sure the model is registered before calling epos.state.connect(...)',
        'and included in your bundle.',
      )
      console.warn('[epos] To allow missing models, use epos.state.configure({ allowMissingModels: true }).')
      console.warn('[epos] Object with the missing model:', getValue())
    }, 10)

    throw new Error(`[epos] Missing model: ${modelName}`)
  }

  private runModelVersioner(model: MObject) {
    const Model = this.getModelByInstance(model)
    if (!Model) throw this.never

    // No versions? -> Ignore
    if (!Model[_modelVersioner_]) return
    const versions = this.getVersionsAsc(Model[_modelVersioner_])
    if (versions.length === 0) return

    // Save current values
    const valuesBefore = { ...model }

    // Get keys before versioner
    const keysBefore = new Set(Object.keys(model))

    // Run versioner
    for (const version of versions) {
      if (this.$.is.number(model[':version']) && model[':version'] >= version) continue
      Model[_modelVersioner_][version].call(model, model)
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
    if (!this.$.is.function(model[method])) return
    model[method]()
  }

  // ---------------------------------------------------------------------------
  // PERSISTENCE
  // ---------------------------------------------------------------------------

  private async save() {
    if (!this.$.env.is.sw) return
    self.clearTimeout(this.saveTimeout)
    const data = this.unwrap(this.root.data)
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

  private set(mObject: MObject, key: string, value: unknown) {
    // Track observable keys for models
    const meta = this.getMeta(mObject)
    if (!meta) throw this.never
    if (meta.model) meta.model.keys.add(key)

    this.$.libs.mobx.set(mObject, key, value)
  }

  private delete(mObject: MObject, key: string) {
    // Track observable keys for models
    const meta = this.getMeta(mObject)
    if (!meta) throw this.never
    if (meta.model) meta.model.keys.delete(key)

    this.$.libs.mobx.remove(mObject, key)
  }

  private keys(value: Obj) {
    const meta = this.getMeta(value)
    if (meta && meta.model) return [...meta.model.keys]
    return Object.keys(value)
  }

  private getMeta(target: any): Meta | null {
    return (target?.[_meta_] as Meta) ?? null
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

  private isModelNode(mNode: MNode): mNode is MObject & { __model: true } {
    const meta = this.getMeta(mNode)
    if (!meta) throw this.never
    return !!meta.model
  }

  private getModelByName(name: unknown) {
    if (!this.$.is.string(name)) return null
    return this.models[name]
  }

  private getModelByInstance(instance: Obj) {
    if (instance.constructor === Object) return null
    return (
      Object.values(this.models).find(Model => instance.constructor === Model) ||
      Object.values(this.models).find(Model => Model.prototype instanceof instance.constructor) ||
      null
    )
  }

  private getModelName(Model: ModelClass) {
    return Object.keys(this.models).find(name => this.models[name] === Model) ?? null
  }

  private unwrap<T>(value: T): T {
    if (this.$.is.object(value)) {
      const keys = this.keys(value)
      const object: Obj = {}
      for (const key of keys) object[key] = this.unwrap(value[key])
      return object as T
    }

    if (this.$.is.array(value)) {
      return value.map(item => this.unwrap(item)) as T
    }

    return value
  }

  private getVersionsAsc(versioner: Versioner) {
    return Object.keys(versioner)
      .map(Number)
      .sort((v1, v2) => v1 - v2)
  }
}
