import type { IArrayWillChange, IArrayWillSplice, IObjectWillChange } from 'mobx'
import type { YArrayEvent, YMapEvent, Array as YjsArray, Map as YjsMap } from 'yjs'
import type { DbKey, DbName, DbStore } from '../../idb/idb.sw'

export const _meta_ = Symbol('meta')
export const _parent_ = Symbol('parent')
export const _init_ = Symbol('init')
export const _cleanup_ = Symbol('cleanup')
export const _versioner_ = Symbol('versioner')

export type Origin = null | 'remote'
export type Location = [DbName, DbStore, DbKey]
export type Versioner = Record<number, (state: MObject) => void>
export type ModelClass = (new (...args: unknown[]) => unknown) & { [_versioner_]?: Versioner }
export type Model = InstanceType<ModelClass>
export type GetInitialState = () => Obj | Model

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
  onDetach: () => void
}

// MobX change types
export type MObjectSetChange = Extract<IObjectWillChange<Obj>, { type: 'add' | 'update' }>
export type MObjectRemoveChange = Extract<IObjectWillChange<Obj>, { type: 'remove' }>
export type MArrayUpdateChange = IArrayWillChange<any>
export type MArraySpliceChange = IArrayWillSplice<any>
export type MNodeChange = MObjectSetChange | MObjectRemoveChange | MArrayUpdateChange | MArraySpliceChange

export type Options = {
  initial?: GetInitialState
  models?: Record<string, ModelClass>
  versioner?: Versioner
}

/**
 * #### How Sync Works
 * MobX → Local Yjs → (bus) → Remote Yjs → MobX
 */
export class State extends $exSw.Unit {
  id: string
  data!: MObject & { ':version'?: number }
  location: Location

  static _meta_ = _meta_
  static _parent_ = _parent_
  static _init_ = _init_
  static _cleanup_ = _cleanup_
  static _versioner_ = _versioner_

  private doc = new this.$.libs.yjs.Doc()
  private bus: ReturnType<$gl.Bus['create']>
  private models: Record<string, ModelClass>
  private versioner: Versioner
  private getInitialState: GetInitialState
  private connected = false

  private hydrationQueue = new Set<MObject>()
  private mobxChangeDepth = 0
  private applyingYjsToMobx = false

  private saveQueue = new this.$.utils.Queue()
  private saveTimeout: number | undefined = undefined
  private SAVE_DELAY = this.$.env.is.dev ? 300 : 2000

  static async create(parent: $exSw.Unit, location: Location, options: Options = {}) {
    const state = new State(parent, location, options)
    await state.$.peer.mutex(`state.setup[${state.id}]`, () => state.init())
    return state
  }

  constructor(parent: $exSw.Unit, location: Location, options: Options = {}) {
    super(parent)
    this.id = location.join('/')
    this.bus = this.$.bus.create(`state[${this.id}]`)
    this.location = location
    this.models = options.models ?? {}
    this.versioner = options.versioner ?? {}
    this.getInitialState = options.initial ?? (() => ({}))
    this.save = this.saveQueue.wrap(this.save, this)
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
      this.data = this.attach(data ?? {}, null)
      this.bus.on('swGetDocAsUpdate', () => this.$.libs.yjs.encodeStateAsUpdate(this.doc))
    } else if (this.$.env.is.ex) {
      const docAsUpdate = await this.bus.send<Uint8Array>('swGetDocAsUpdate')
      this.$.libs.yjs.applyUpdate(this.doc, docAsUpdate, 'remote')
      const yRoot = this.doc.getMap('root')
      this.applyingYjsToMobx = true
      this.data = this.attach(yRoot, null)
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

    // 5. Set initial state. Run state versioner. Hydrate models.
    this.transaction(() => {
      $: (() => {
        const versions = this.getVersionsAsc(this.versioner)

        // Empty state?
        if (Object.keys(this.data).length === 0) {
          // Set initial state
          this.data = this.attach(this.getInitialState(), null)

          // State itself is a model? -> Don't use state versioner (model versioner will be used)
          if (this.isModel(this.data)) return

          // Set the latest version
          if (versions.length === 0) return
          this.$.libs.mobx.set(this.data, ':version', versions.at(-1))
        }

        // Non-empty state?
        else {
          // State itself is a model? -> Don't run state versioner (model versioner will be run)
          if (this.isModel(this.data)) return

          // Run state versioner
          for (const version of versions) {
            if (this.$.is.number(this.data[':version']) && this.data[':version'] >= version) continue
            this.versioner[version].call(this.data, this.data)
            this.data[':version'] = version
          }
        }
      })()

      // Hydrate models
      this.hydrateModels()
    })

    // 6. Save changes
    this.saveDebounced()

    // 7. Mark as connected
    this.connected = true
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
      const Model = this.getModelByName(yMap.get('@'))
      const mObject: MObject = this.$.libs.mobx.observable.object({}, {}, { deep: false, proxy: !Model })
      this.wire(mObject, yMap, parent)
      if (Model) this.applyModel(mObject, Model, false)
      yMap.forEach((value, key) => this.$.libs.mobx.set(mObject, key, value))
      if (Model) this.hydrationQueue.add(mObject)
      return mObject
    }

    if (source instanceof this.$.libs.yjs.Array) {
      const yArray = source
      const mArray: MArray = this.$.libs.mobx.observable.array([], { deep: false })
      this.wire(mArray, yArray, parent)
      yArray.forEach(item => mArray.push(item))
      return mArray
    }

    if (this.$.is.object(source)) {
      const object = source
      const Model = this.getModelByName(object['@']) ?? this.getModelByInstance(object)
      const mObject: MObject = this.$.libs.mobx.observable.object({}, {}, { deep: false, proxy: !Model })
      const yMap = !parent ? this.doc.getMap('root') : new this.$.libs.yjs.Map()
      this.wire(mObject, yMap, parent)
      if (Model) this.applyModel(mObject, Model, object instanceof Model)
      for (const key in object) this.$.libs.mobx.set(mObject, key, object[key])
      if (Model) this.hydrationQueue.add(mObject)
      return mObject
    }

    if (this.$.is.array(source)) {
      const array = source
      const mArray: MArray = this.$.libs.mobx.observable.array([], { deep: false })
      const yArray = new this.$.libs.yjs.Array()
      this.wire(mArray, yArray, parent)
      array.forEach(item => mArray.push(item))
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

    console.error('Unsupported state value:', source)
    throw new Error('Unsupported state value')
  }

  private wire(mNode: MNode, yNode: YNode, parent: Parent) {
    // Start node observers
    const unobserveMNode = this.$.libs.mobx.intercept(mNode, this.onMNodeChange as any)
    yNode.observe(this.onYNodeChange)

    const onDetach = () => {
      // Stop node observers
      unobserveMNode()
      yNode.unobserve(this.onYNodeChange)

      // Delete parent reference
      delete mNode[_parent_]

      // Delete meta reference
      delete mNode[_meta_]
      delete yNode[_meta_]

      // Delete dev helpers
      delete mNode._
      delete yNode._
      delete mNode.__

      // Cleanup model
      if (this.isModel(mNode)) {
        if (this.hydrationQueue.has(mNode)) this.hydrationQueue.delete(mNode)
        this.runModelMethod(mNode, _cleanup_)
      }
    }

    // Define parent
    Reflect.defineProperty(mNode, _parent_, { configurable: true, get: () => parent })

    // Define meta
    const meta: Meta = { mNode, yNode, onDetach }
    Reflect.defineProperty(mNode, _meta_, { configurable: true, get: () => meta })
    Reflect.defineProperty(yNode, _meta_, { configurable: true, get: () => meta })

    // Define dev helpers
    Reflect.defineProperty(mNode, '_', { configurable: true, get: () => this.unwrap(mNode) })
    Reflect.defineProperty(yNode, '_', { configurable: true, get: () => yNode.toJSON() })
    Reflect.defineProperty(mNode, '__', { configurable: true, get: () => this.$.libs.mobx.toJS(mNode) })
  }

  private detach(target: unknown) {
    const meta = this.getMeta(target)
    if (meta) meta.onDetach()

    if (this.$.is.object(target)) {
      const keys = this.keys(target)
      for (const key of keys) this.detach(target[key])
    } else if (this.$.is.array(target)) {
      for (const item of target) this.detach(item)
    }
  }

  // ---------------------------------------------------------------------------
  // MOBX CHANGE HANDLERS
  // ---------------------------------------------------------------------------

  private onMNodeChange = (change: MNodeChange) => {
    // When connected, track the MobX change depth. When the depth reaches 0 at the end of a change,
    // it means the entire operation has completed. After this, queued models are hydrated.
    if (this.connected) this.mobxChangeDepth += 1

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

      // Hydrate models when the entire MobX change operation has completed
      this.mobxChangeDepth -= 1
      if (this.mobxChangeDepth === 0) this.hydrateModels()
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
          this.$.libs.mobx.set(mObject, key, yMap.get(key))
        } else {
          this.$.libs.mobx.remove(mObject, key)
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
  // PERSISTENCE
  // ---------------------------------------------------------------------------

  private async save() {
    if (!this.$.env.is.sw) return
    self.clearTimeout(this.saveTimeout)
    const data = this.unwrap(this.data)
    const [_, error] = await this.$.utils.safe(this.$.idb.set(...this.location, data))
    if (error) this.log.error('Failed to save state to IndexedDB', error)
  }

  private saveDebounced() {
    if (!this.$.env.is.sw) return
    self.clearTimeout(this.saveTimeout)
    this.saveTimeout = self.setTimeout(() => this.save(), this.SAVE_DELAY)
  }

  // ---------------------------------------------------------------------------
  // MODEL MANAGEMENT
  // ---------------------------------------------------------------------------

  private getModelByName(name: unknown) {
    if (!this.$.is.string(name)) return null
    return this.models[name] ?? null
  }

  private getModelByInstance(instance: Obj) {
    return Object.values(this.models).find(Model => instance instanceof Model) ?? null
  }

  private getModelName(Model: ModelClass) {
    return Object.keys(this.models).find(name => this.models[name] === Model) ?? null
  }

  private isModel(value: unknown): value is MObject & { __model: true } {
    if (!this.$.is.object(value)) return false
    return !!this.getModelByInstance(value)
  }

  private applyModel(mObject: MObject, Model: ModelClass, fresh: boolean) {
    // Apply model prototype
    Reflect.setPrototypeOf(mObject, Model.prototype)

    // Fresh? -> Set '@' and ':version' fields
    if (fresh) {
      const name = this.getModelName(Model)
      if (!name) throw this.never
      this.$.libs.mobx.set(mObject, '@', name)
      const versions = this.getVersionsAsc(Model[_versioner_] ?? {})
      if (versions.length > 0) this.$.libs.mobx.set(mObject, ':version', versions.at(-1))
    }
  }

  private hydrateModels() {
    const queue = this.hydrationQueue
    if (queue.size === 0) return
    this.hydrationQueue = new Set()

    this.transaction(() => {
      for (const model of queue) this.runModelVersioner(model)
      for (const model of queue) this.runModelMethod(model, _init_)
    })
  }

  private runModelVersioner(model: MObject) {
    const Model = this.getModelByInstance(model)
    if (!Model) throw this.never

    // No versions? -> Ignore
    if (!Model[_versioner_]) return
    const versions = this.getVersionsAsc(Model[_versioner_])
    if (versions.length === 0) return

    // Get keys before versioner
    const keysBefore = new Set(Object.keys(model))

    // Run versioner
    for (const version of versions) {
      if (this.$.is.number(model[':version']) && model[':version'] >= version) continue
      Model[_versioner_][version].call(model, model)
      model[':version'] = version
    }

    // Get keys after versioner
    const keysAfter = new Set(Object.keys(model))

    // Notify MobX about removed keys
    for (const key of keysBefore) {
      if (keysAfter.has(key)) continue
      model[key] = null // Required for MobX to detect change inside 'remove' below
      this.$.libs.mobx.remove(model, key)
    }

    // Notify MobX about added keys
    for (const key of keysAfter) {
      if (keysBefore.has(key)) continue
      const value = model[key]
      delete model[key] // Required for MobX to detect change inside 'set' below
      this.$.libs.mobx.set(model, key, value)
    }
  }

  private runModelMethod(model: MObject, method: PropertyKey) {
    if (!this.$.is.function(model[method])) return
    model[method]()
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

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

  private keys(value: Obj) {
    const yNode = this.getYNode(value)
    if (!yNode) return Object.keys(value)
    return [...yNode.keys()]
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
