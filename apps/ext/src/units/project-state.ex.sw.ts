import type { DbName, DbStoreKey, DbStoreName } from '@eposlabs/idb'
import type { IArrayWillChange, IArrayWillSplice, IObjectWillChange } from 'mobx'
import type { YArrayEvent, YMapEvent, Array as YjsArray, Map as YjsMap } from 'yjs'

export const _meta_ = Symbol('meta')
export const _parent_ = Symbol('parent')
export const _attach_ = Symbol('attach')
export const _detach_ = Symbol('detach')

export type Origin = null | 'remote'
export type Location = [DbName, DbStoreName, DbStoreKey]
export type Root<T> = Initial<T> & { ':version'?: number }
export type Initial<T> = T extends Obj ? T : Instance<T>
export type Instance<T> = T extends object ? Exclude<T, Obj | Arr | Fn> : never
export type Versioner<T> = Record<number, (this: Root<T>, state: Root<T>) => void>
export type Parent = MNode | null

// MobX node
export type MObject = Obj & { [_parent_]?: Parent; [_meta_]?: Meta; _?: unknown }
export type MArray = Arr & { [_parent_]?: Parent; [_meta_]?: Meta; _?: unknown }
export type MNode = MObject | MArray

// Yjs node
export type YMap = YjsMap<unknown> & { [_meta_]?: Meta; _?: unknown }
export type YArray = YjsArray<unknown> & { [_meta_]?: Meta; _?: unknown }
export type YNode = YMap | YArray

// Meta info attached to every MobX and Yjs node
export type Meta = { mNode: MNode; yNode: YNode; unwire: () => void }

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
export class ProjectState<T = Obj> extends exSw.Unit {
  static _meta_ = _meta_
  static _parent_ = _parent_
  static _attach_ = _attach_
  static _detach_ = _detach_

  name: string
  root: Root<T> = {} as Root<T>
  private $states = this.closest(exSw.ProjectStates)!
  private $project = this.closest<ex.Project | sw.Project>('Project')!
  private doc = new this.$.libs.yjs.Doc()
  private local: boolean
  private initial: Initial<T> | null = null
  private versioner: Versioner<T>
  private connected = false
  private bus: ReturnType<gl.Bus['for']>
  private applyingYjsToMobx = false
  private attachQueue: (() => void)[] = []
  private saveTimeout = -1
  private SAVE_DELAY = 300

  get id() {
    return `${this.$project.id}/${this.name}`
  }

  get location(): Location {
    return [this.$project.id, ':state', this.name]
  }

  constructor(parent: exSw.Unit, name: string | null, initial?: Initial<T>, versioner?: Versioner<T>) {
    super(parent)
    this.name = name ?? `local:${this.$.utils.id()}`
    this.initial = initial ?? ({} as Initial<T>)
    this.versioner = versioner ?? {}
    this.local = name === null
    this.bus = this.$.bus.for(`State[${this.id}]`)
    this.save = this.$.utils.enqueue(this.save, this)
    if (this.local) this.initLocal()
  }

  async init() {
    if (this.local) throw this.never()
    await this.$.peer.mutex(`State.setup[${this.id}]`, () => this.setup())
    this.bus.on('connected', () => true)
  }

  private initLocal() {
    const initial = this.getInitialState()
    this.root = this.attach(initial, null) as Root<T>
    this.flushAttachQueue()
    this.connected = true
  }

  async disconnect() {
    if (this.local) return
    if (!this.connected) return
    this.connected = false
    this.bus.off()
    this.doc.destroy()
    await this.save(true)
  }

  transaction(fn: () => void) {
    this.$.libs.mobx.runInAction(() => {
      if (this.local) {
        fn()
      } else {
        this.doc.transact(() => fn())
      }
    })
  }

  async hasPeers() {
    return !!(await this.bus.send<boolean>('connected'))
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

    // Load state
    if (this.$.env.is.sw) {
      const root = await this.$.idb.get<Obj>(...this.location)
      this.root = this.attach(root ?? {}, null) as Root<T>
      this.bus.on('swGetDocAsUpdate', () => this.$.libs.yjs.encodeStateAsUpdate(this.doc))
    } else if (this.$.env.is.ex) {
      const docAsUpdate = await this.bus.send<Uint8Array>('swGetDocAsUpdate')
      if (!docAsUpdate) throw this.never()
      this.$.libs.yjs.applyUpdate(this.doc, docAsUpdate, 'remote')
      const yRoot = this.doc.getMap('root')
      this.root = this.attach(yRoot, null) as Root<T>
    }

    // Apply missed updates
    for (const update of missedUpdates) {
      this.$.libs.yjs.applyUpdate(this.doc, update, 'remote')
    }

    // Start local changes broadcaster
    this.doc.on('update', async (update: Uint8Array, origin: Origin) => {
      if (origin === null) await this.bus.send('update', update)
    })

    // Finalize setup:
    // - Set initial state
    // - Apply versioner
    // - Flush attach queue
    this.transaction(() => {
      if (!this.$.utils.is.object(this.root)) throw this.never()

      // Get sorted version numbers
      const asc = (v1: number, v2: number) => v1 - v2
      const versions = Object.keys(this.versioner).filter(this.$.utils.is.numeric).map(Number).sort(asc)

      // Empty state? -> Set initial state
      if (Object.keys(this.root).length === 0) {
        const initial = this.getInitialState()
        this.detach(this.root) // Detach empty root to remove yRoot observer
        this.root = this.attach(initial, null) as Root<T>
        if (!this.$.utils.is.object(this.root)) throw this.never()
        if (versions.length > 0) this.root[':version'] = versions.at(-1)
      }

      // Non-empty state? -> Apply versioner
      else {
        for (const version of versions) {
          if (this.$.utils.is.number(this.root[':version']) && this.root[':version'] >= version) continue
          const versionFn = this.versioner[version]
          if (!versionFn) throw this.never()
          versionFn.call(this.root, this.root)
          this.root[':version'] = version
        }
      }

      // Mark as connected.
      // It is important to mark as connected before running attach handlers,
      // because attach calls may create new state objects (with new attach calls).
      this.connected = true

      // Flush attach queue
      this.flushAttachQueue()

      // Free up memory
      this.initial = null
    })

    // Save changes
    this.saveWithDelay()
  }

  // MARK: Attach / Detach
  // ============================================================================

  private attach(value: unknown, parent: Parent) {
    if (value instanceof this.$.libs.yjs.Map) return this.attachYMap(value, parent)
    if (value instanceof this.$.libs.yjs.Array) return this.attachYArray(value, parent)
    if (this.$.utils.is.object(value)) return this.attachObject(value, parent)
    if (this.$.utils.is.array(value)) return this.attachArray(value, parent)
    if (this.local || this.isSupportedValue(value)) return value
    console.error('Unsupported value:', value)
    const type = value?.constructor.name ?? typeof value
    const message = `State does not support ${type} values`
    const tip = `Supported types: object, array, string, number, boolean, null, undefined`
    throw new Error(`${message}. ${tip}.`)
  }

  private attachYMap(yMap: YMap, parent: Parent) {
    // Get model if `@` tag is present
    const tag = this.$.utils.is.string(yMap.get('@')) ? String(yMap.get('@')) : null
    const Model = tag ? this.getModelByName(tag) : null

    // Create empty MobX node
    const mObject: MObject = this.$.libs.mobx.observable.object({}, {}, { deep: false })

    // Wire nodes
    this.wire(mObject, yMap, parent)

    // Set model prototype
    if (Model) Reflect.setPrototypeOf(mObject, Model.prototype)

    // Populate MobX node ignoring MobX -> Yjs sync
    const prevApplyingYjsToMobx = this.applyingYjsToMobx
    this.applyingYjsToMobx = true
    yMap.forEach((value, key) => (mObject[key] = value))
    this.applyingYjsToMobx = prevApplyingYjsToMobx

    // Process attach
    this.processAttach(mObject)

    return mObject
  }

  private attachYArray(yArray: YArray, parent: Parent) {
    // Create empty MobX node
    const mArray: MArray = this.$.libs.mobx.observable.array([], { deep: false })

    // Wire nodes
    this.wire(mArray, yArray, parent)

    // Populate MobX node ignoring MobX -> Yjs sync
    const prevApplyingYjsToMobx = this.applyingYjsToMobx
    this.applyingYjsToMobx = true
    yArray.forEach(item => mArray.push(item))
    this.applyingYjsToMobx = prevApplyingYjsToMobx

    return mArray
  }

  private attachObject(object: Obj, parent: Parent) {
    // Get model if `@` tag is present
    const tag = this.$.utils.is.string(object['@']) ? object['@'] : null
    const ModelByTag = tag ? this.getModelByName(tag) : null
    const ModelByInstance = this.getModelByInstance(object)
    const Model = ModelByTag ?? ModelByInstance

    // Make non-model class instances observable for local state
    if (this.local) {
      const isClassInstance = object.constructor !== Object
      if (!Model && isClassInstance) return this.$.libs.mobx.makeAutoObservable(object)
    }

    // Create empty MobX and Yjs nodes
    const mObject: MObject = this.$.libs.mobx.observable.object({}, {}, { deep: false })
    const yMap = !parent ? this.doc.getMap('root') : new this.$.libs.yjs.Map()

    // Wire nodes
    this.wire(mObject, yMap, parent)

    // Set model prototype and `@` tag
    if (Model) Reflect.setPrototypeOf(mObject, Model.prototype)
    if (ModelByInstance) mObject['@'] = this.getModelName(ModelByInstance)

    // Populate MobX node (Yjs node will be populated automatically via MobX observer)
    Object.keys(object).forEach(key => (mObject[key] = object[key]))

    // Process attach
    this.processAttach(mObject)

    return mObject
  }

  private attachArray(array: Arr, parent: Parent) {
    // Create empty MobX and Yjs nodes
    const mArray: MArray = this.$.libs.mobx.observable.array([], { deep: false })
    const yArray = new this.$.libs.yjs.Array()

    // Wire nodes
    this.wire(mArray, yArray, parent)

    // Populate MobX node (Yjs node will be populated automatically via MobX observer)
    array.forEach(item => mArray.push(item))

    return mArray
  }

  private detach(target: unknown) {
    // Not attached? -> Skip.
    // All nested nodes are not attached as well in this case.
    const meta = this.getMeta(target)
    if (!meta) return

    // Unwire the node
    meta.unwire()

    // Detach nested nodes
    if (this.$.utils.is.object(target)) {
      Object.keys(target).forEach(key => this.detach(target[key]))
      if (this.$.utils.is.function(target[_detach_])) target[_detach_]()
    } else if (this.$.utils.is.array(target)) {
      target.forEach(item => this.detach(item))
    }
  }

  private wire(mNode: MNode, yNode: YNode, parent: Parent) {
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
    }

    // Start node observers
    const unobserveMNode = this.$.libs.mobx.intercept(mNode, this.onMNodeChange as any)
    yNode.observe(this.onYNodeChange)

    // Define meta
    const meta: Meta = { mNode, yNode, unwire }
    Reflect.defineProperty(mNode, _meta_, { configurable: true, get: () => meta })
    Reflect.defineProperty(yNode, _meta_, { configurable: true, get: () => meta })

    // Define parent. Do not store parent on meta, to allow `state.value[epos.state.PARENT]` access.
    Reflect.defineProperty(mNode, _parent_, { configurable: true, get: () => parent })

    // Define dev helpers
    Reflect.defineProperty(mNode, '_', { configurable: true, get: () => this.$.libs.mobx.toJS(mNode) })
    Reflect.defineProperty(yNode, '_', { configurable: true, get: () => yNode.toJSON() })
  }

  private processAttach(mObject: MObject) {
    const attach = mObject[_attach_]
    if (!this.$.utils.is.function(attach)) return

    if (this.connected) {
      attach.call(mObject)
    } else {
      this.attachQueue.push(() => attach.call(mObject))
    }
  }

  private flushAttachQueue() {
    this.attachQueue.forEach(attach => attach())
    this.attachQueue = []
  }

  // MARK: MobX Processing
  // ============================================================================

  private onMNodeChange = (change: MNodeChange) => {
    // Process 'change' object:
    // - Create nodes for new values
    // - Detach removed values
    // - Update corresponding yNode
    if (this.isMObjectChange(change)) {
      // - object[newKey] = value (add)
      // - object[existingKey] = value (update)
      if (change.type === 'add' || change.type === 'update') {
        this.processMObjectSet(change)
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

    // Save changes
    this.saveWithDelay()

    return change
  }

  private processMObjectSet(change: MObjectSetChange) {
    // Skip symbols
    if (this.$.utils.is.symbol(change.name)) return

    // Skip getters
    if (change.newValue === undefined && !change.object.hasOwnProperty(change.name)) return

    // Skip if value didn't change
    if (change.newValue === change.object[change.name]) return

    // Attach new value
    change.newValue = this.attach(change.newValue, change.object)

    // Detach old value
    this.detach(change.object[change.name])

    // Update corresponding Yjs node
    if (!this.local && !this.applyingYjsToMobx) {
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
    if (!this.local && !this.applyingYjsToMobx) {
      this.doc.transact(() => {
        const yMap = this.getYNode(change.object)
        if (!yMap) throw this.never()
        yMap.delete(String(change.name))
      })
    }
  }

  private processMArrayUpdate(change: MArrayUpdateChange) {
    // Attach new value
    change.newValue = this.attach(change.newValue, change.object)

    // Detach old value
    this.detach(change.object[change.index])

    // Update corresponding Yjs node
    if (!this.local && !this.applyingYjsToMobx) {
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
    change.added = change.added.map(item => this.attach(item, change.object))

    // Detach removed items
    for (let i = change.index; i < change.index + change.removedCount; i++) {
      this.detach(change.object[i])
    }

    // Update corresponding Yjs node
    if (!this.local && !this.applyingYjsToMobx) {
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

  // MARK: Yjs Processing
  // ============================================================================

  private onYNodeChange = async (e: YMapEvent<unknown> | YArrayEvent<unknown>) => {
    // Ignore local changes
    if (e.transaction.origin !== 'remote') return

    // Apply remote changes
    if (e instanceof this.$.libs.yjs.YMapEvent) {
      this.processYMapChange(e)
    } else {
      this.processYArrayChange(e)
    }
  }

  private processYMapChange(e: YMapEvent<unknown>) {
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

  private processYArrayChange(e: YArrayEvent<unknown>) {
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

  // MARK: Persistence
  // ============================================================================

  private async save(force = false) {
    if (this.local) return
    if (!this.$.env.is.sw) return
    if (!this.connected && !force) return
    if (!this.root) throw this.never()
    clearTimeout(this.saveTimeout)
    const root = this.$.libs.mobx.toJS(this.root)
    const [_, error] = await this.$.utils.safe(this.$.idb.set(...this.location, root))
    if (error) this.log.error('Failed to save state to IndexedDB', error)
  }

  private saveWithDelay() {
    if (this.local) return
    if (!this.$.env.is.sw) return
    if (!this.connected) return
    clearTimeout(this.saveTimeout)
    this.saveTimeout = setTimeout(() => this.save(), this.SAVE_DELAY)
  }

  // MARK: Helpers
  // ============================================================================

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

  private getModelByName(name: string) {
    const Model = this.$states.models[name]
    if (Model) return Model
    const allowMissingModels = this.$.env.is.sw || this.$states.config.allowMissingModels
    if (allowMissingModels) return null
    const message = `Model '${name}' is not registered`
    const tip1 = `Make sure you registered it via epos.state.register() before calling epos.state.connect()`
    const tip2 = `To allow missing models, set config.allowMissingModels to true in epos.json`
    throw new Error(`${message}. ${tip1}. ${tip2}.`)
  }

  private getModelByInstance(instance: Obj) {
    if (instance.constructor === Object) return null
    const registeredModels = Object.values(this.$states.models)
    const Model = registeredModels.find(Model => instance.constructor === Model) ?? null
    if (Model) return Model
    const allowMissingModels = this.$.env.is.sw || this.$states.config.allowMissingModels
    if (allowMissingModels) return null
    const message = `Class '${instance.constructor.name}' is not registered as a model`
    const tip1 = `Make sure you registered it via epos.state.register()`
    const tip2 = `To allow missing models, set config.allowMissingModels to true in epos.json`
    throw new Error(`${message}. ${tip1}. ${tip2}.`)
  }

  private getInitialState() {
    if (!this.$.utils.is.object(this.initial)) throw new Error('Initial state must be an object')
    return this.initial
  }

  private getModelName(Model: Ctor) {
    const registeredModelNames = Object.keys(this.$states.models)
    return registeredModelNames.find(name => this.$states.models[name] === Model) ?? null
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
}
