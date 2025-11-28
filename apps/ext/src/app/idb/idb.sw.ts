export const _cleanup_ = Symbol('cleanup')

export type DbName = string
export type DbStoreName = string
export type DbStoreKey = string
export type Database = IDBDatabase & { [_cleanup_]?: () => void }

export class Idb extends sw.Unit {
  private dbs: { [name: DbName]: Database } = {}
  private queues: Record<string, InstanceType<typeof this.$.utils.Queue>> = {}
  static _cleanup_ = _cleanup_

  constructor(parent: sw.Unit) {
    super(parent)

    this.get = this.enqueueByDbName(this.get)
    this.has = this.enqueueByDbName(this.has)
    this.set = this.enqueueByDbName(this.set)
    this.keys = this.enqueueByDbName(this.keys)
    this.delete = this.enqueueByDbName(this.delete)
    this.deleteStore = this.enqueueByDbName(this.deleteStore)
    this.deleteDatabase = this.enqueueByDbName(this.deleteDatabase)

    this.$.bus.on('idb.get', this.get, this)
    this.$.bus.on('idb.has', this.has, this)
    this.$.bus.on('idb.set', this.set, this)
    this.$.bus.on('idb.keys', this.keys, this)
    this.$.bus.on('idb.delete', this.delete, this)

    this.$.bus.on('idb.listStores', this.listStores, this)
    this.$.bus.on('idb.listDatabases', this.listDatabases, this)
    this.$.bus.on('idb.deleteStore', this.deleteStore, this)
    this.$.bus.on('idb.deleteDatabase', this.deleteDatabase, this)
  }

  /** Get a value from the store. */
  async get<T = unknown>(dbName: DbName, storeName: DbStoreName, key: DbStoreKey) {
    // DB does not exist? -> Return null
    const exists = await this.exists(dbName)
    if (!exists) return null

    // Store does not exist? -> Return null
    const db = await this.ensureDb(dbName)
    if (!db.objectStoreNames.contains(storeName)) return null

    // Get value from store
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction([storeName], 'readonly')
      const req = tx.objectStore(storeName).get(key)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }

  /** Check if a key exists in the store. */
  async has(dbName: DbName, storeName: DbStoreName, key: DbStoreKey) {
    // DB does not exist? -> Return false
    const exists = await this.exists(dbName)
    if (!exists) return false

    // Store does not exist? -> Return false
    const db = await this.ensureDb(dbName)
    if (!db.objectStoreNames.contains(storeName)) return false

    // Check if key exists in store
    return await new Promise<boolean>((resolve, reject) => {
      const tx = db.transaction([storeName], 'readonly')
      const req = tx.objectStore(storeName).getKey(key)
      req.onsuccess = () => resolve(req.result !== undefined)
      req.onerror = () => reject(req.error)
    })
  }

  /** Set a value in the store. */
  async set<T = unknown>(dbName: DbName, storeName: DbStoreName, key: DbStoreKey, value: T) {
    // Ensure store for the DB
    const db = await this.ensureStore(dbName, storeName)

    // Set value
    await new Promise((resolve, reject) => {
      const tx = db.transaction([storeName], 'readwrite')
      const req = tx.objectStore(storeName).put(value, key)
      req.onsuccess = () => resolve(true)
      req.onerror = () => reject(req.error)
      tx.onabort = () => reject(tx.error)
    })
  }

  /** Get a list of all keys in the store of the database. */
  async keys(dbName: DbName, storeName: DbStoreName) {
    // DB does not exist? -> Return []
    const exists = await this.exists(dbName)
    if (!exists) return []

    // Store does not exist? -> Return []
    const db = await this.ensureDb(dbName)
    if (!db.objectStoreNames.contains(storeName)) return []

    // Get store keys
    return await new Promise<DbStoreKey[]>((resolve, reject) => {
      const tx = db.transaction([storeName], 'readonly')
      const req = tx.objectStore(storeName).getAllKeys()
      req.onsuccess = () => resolve(req.result.filter(this.$.utils.is.string))
      req.onerror = () => reject(req.error)
    })
  }

  /** Delete a key from the store. */
  async delete(dbName: DbName, storeName: DbStoreName, key: DbStoreKey) {
    // DB does not exist? -> Done
    const exists = await this.exists(dbName)
    if (!exists) return

    // Store does not exist? -> Done
    const db = await this.ensureDb(dbName)
    if (!db.objectStoreNames.contains(storeName)) return

    // Delete store key
    await new Promise((resolve, reject) => {
      const tx = db.transaction([storeName], 'readwrite')
      const req = tx.objectStore(storeName).delete(key)
      req.onsuccess = () => resolve(true)
      req.onerror = () => reject(req.error)
    })
  }

  /** Get a list of all store names in the database. */
  async listStores(dbName: DbName) {
    const exists = await this.exists(dbName)
    if (!exists) return []
    const db = await this.ensureDb(dbName)
    return [...db.objectStoreNames]
  }

  /** Get a list of all database names. */
  async listDatabases() {
    const dbs = await indexedDB.databases()
    return dbs.map(db => db.name).filter(this.$.utils.is.present)
  }

  /** Delete the store from the database. */
  async deleteStore(dbName: DbName, storeName: DbStoreName) {
    // DB does not exist? -> Done
    const exists = await this.exists(dbName)
    if (!exists) return

    // Store does not exist? -> Done
    const db = await this.ensureDb(dbName)
    if (!db.objectStoreNames.contains(storeName)) return

    // Unregister DB
    this.unregister(dbName)

    // Delete store (new DB instance is created during upgrade)
    const newDb = await new Promise<Database>((resolve, reject) => {
      const req = indexedDB.open(dbName, db.version + 1)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
      req.onupgradeneeded = () => req.result.deleteObjectStore(storeName)
    })

    // Register new DB instance
    this.register(dbName, newDb)
  }

  /** Delete the entire database. */
  async deleteDatabase(dbName: DbName) {
    // DB does not exist? -> Done
    const exists = await this.exists(dbName)
    if (!exists) return

    // Unregister DB
    this.unregister(dbName)

    // Delete DB
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(dbName)
      req.onsuccess = () => resolve(true)
      req.onerror = () => reject(req.error)
    })
  }

  /** Delete all databases. */
  async purge() {
    const names = await this.listDatabases()
    for (const name of names) {
      await this.deleteDatabase(name)
    }
  }

  /** Check if a database with the given name exists. */
  private async exists(dbName: DbName) {
    // Connected to the DB? -> true
    if (this.dbs[dbName]) return true

    // Check if DB exists
    const dbs = await indexedDB.databases()
    return !!dbs.find(db => db.name === dbName)
  }

  /** Ensure that the database with the given name exists and returns it. */
  private async ensureDb(dbName: DbName) {
    // Already connected? -> Just return DB
    if (this.dbs[dbName]) return this.dbs[dbName]

    // Get DB version if it exists, or start with version 1
    const dbs = await indexedDB.databases()
    const meta = dbs.find(db => db.name === dbName)
    const version = meta?.version || 1

    // Create DB / connnect to the existing one
    const db = await new Promise<Database>((resolve, reject) => {
      const req = indexedDB.open(dbName, version)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })

    // Register DB instance
    this.register(dbName, db)

    return db
  }

  /** Ensure that the store exists. Returns store's database. */
  private async ensureStore(dbName: DbName, storeName: DbStoreName) {
    // Ensure DB
    const db = await this.ensureDb(dbName)

    // Store already exists? -> Done
    if (db.objectStoreNames.contains(storeName)) return db

    // Unregister DB
    this.unregister(dbName)

    // Create store (new DB instance is created during upgrade)
    const newDb = await new Promise<Database>((resolve, reject) => {
      const req = indexedDB.open(dbName, db.version + 1)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
      req.onupgradeneeded = () => req.result.createObjectStore(storeName)
    })

    // Register new DB instance
    this.register(dbName, newDb)

    return newDb
  }

  private register(dbName: DbName, db: Database) {
    this.dbs[dbName] = db

    // 'close' event is fired when closed unexpectedly, e.g. by deleting via devtools
    const onClose = () => delete this.dbs[dbName]
    db.addEventListener('close', onClose)
    db[_cleanup_] = () => db.removeEventListener('close', onClose)
  }

  private unregister(dbName: DbName) {
    if (!this.dbs[dbName]) return
    this.dbs[dbName].close()
    this.dbs[dbName][_cleanup_]?.()
    delete this.dbs[dbName]
  }

  /** Wrap method to be run in a queue for the given database. */
  private enqueueByDbName<T extends AsyncFn>(fn: T) {
    return (async (dbName: DbName, ...args: unknown[]) => {
      const queue = (this.queues[dbName] ??= new this.$.utils.Queue(dbName))
      const result = await queue.add(() => fn.call(this, dbName, ...args))
      if (queue.isEmpty()) delete this.queues[dbName]
      return result
    }) as T
  }
}
