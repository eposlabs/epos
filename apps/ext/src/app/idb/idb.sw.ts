const _cleanup_ = Symbol('cleanup')

export type DbName = string
export type DbStore = string
export type DbKey = string
export type Database = IDBDatabase & { [_cleanup_]?: () => void }

export class Idb extends sw.Unit {
  private dbs: { [name: DbName]: Database } = {}
  private queues = new this.$.utils.QueueMap()
  static _cleanup_ = _cleanup_

  constructor(parent: sw.Unit) {
    super(parent)

    this.get = this.enqueue(this.get)
    this.has = this.enqueue(this.has)
    this.set = this.enqueue(this.set)
    this.keys = this.enqueue(this.keys)
    this.delete = this.enqueue(this.delete)
    this.deleteStore = this.enqueue(this.deleteStore)
    this.deleteDatabase = this.enqueue(this.deleteDatabase)

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
  async get<T = unknown>(name: DbName, store: DbStore, key: DbKey) {
    // DB does not exist? -> Return null
    const exists = await this.exists(name)
    if (!exists) return null

    // Store does not exist? -> Return null
    const db = await this.ensureDb(name)
    if (!db.objectStoreNames.contains(store)) return null

    // Get value from store
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction([store], 'readonly')
      const req = tx.objectStore(store).get(key)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }

  /** Check if a key exists in the store. */
  async has(name: DbName, store: DbStore, key: DbKey) {
    // DB does not exist? -> Return false
    const exists = await this.exists(name)
    if (!exists) return false

    // Store does not exist? -> Return false
    const db = await this.ensureDb(name)
    if (!db.objectStoreNames.contains(store)) return false

    // Check if key exists in store
    return await new Promise<boolean>((resolve, reject) => {
      const tx = db.transaction([store], 'readonly')
      const req = tx.objectStore(store).getKey(key)
      req.onsuccess = () => resolve(req.result !== undefined)
      req.onerror = () => reject(req.error)
    })
  }

  /** Set a value in the store. */
  async set<T = unknown>(name: DbName, store: DbStore, key: DbKey, value: T) {
    // Ensure store for the DB
    const db = await this.ensureStore(name, store)

    // Set value
    await new Promise((resolve, reject) => {
      const tx = db.transaction([store], 'readwrite')
      const req = tx.objectStore(store).put(value, key)
      req.onsuccess = () => resolve(true)
      req.onerror = () => reject(req.error)
      tx.onabort = () => reject(tx.error)
    })
  }

  /** Get a list of all keys in the store of the database. */
  async keys(name: DbName, store: DbStore) {
    // DB does not exist? -> Return []
    const exists = await this.exists(name)
    if (!exists) return []

    // Store does not exist? -> Return []
    const db = await this.ensureDb(name)
    if (!db.objectStoreNames.contains(store)) return []

    // Get store keys
    return await new Promise<DbKey[]>((resolve, reject) => {
      const tx = db.transaction([store], 'readonly')
      const req = tx.objectStore(store).getAllKeys()
      req.onsuccess = () => resolve(req.result.filter(this.$.utils.is.string))
      req.onerror = () => reject(req.error)
    })
  }

  /** Delete a key from the store. */
  async delete(name: DbName, store: DbStore, key: DbKey) {
    // DB does not exist? -> Done
    const exists = await this.exists(name)
    if (!exists) return

    // Store does not exist? -> Done
    const db = await this.ensureDb(name)
    if (!db.objectStoreNames.contains(store)) return

    // Delete store key
    await new Promise((resolve, reject) => {
      const tx = db.transaction([store], 'readwrite')
      const req = tx.objectStore(store).delete(key)
      req.onsuccess = () => resolve(true)
      req.onerror = () => reject(req.error)
    })
  }

  /** Get a list of all store names in the database. */
  async listStores(name: DbName) {
    const exists = await this.exists(name)
    if (!exists) return []
    const db = await this.ensureDb(name)
    return [...db.objectStoreNames]
  }

  /** Get a list of all database names. */
  async listDatabases() {
    const dbs = await indexedDB.databases()
    return dbs.map(db => db.name).filter(this.$.utils.is.present)
  }

  /** Delete the store from the database. */
  async deleteStore(name: DbName, store: DbStore) {
    // DB does not exist? -> Done
    const exists = await this.exists(name)
    if (!exists) return

    // Store does not exist? -> Done
    const db = await this.ensureDb(name)
    if (!db.objectStoreNames.contains(store)) return

    // Unregister DB
    this.unregister(name)

    // Delete store (new DB instance is created during upgrade)
    const newDb = await new Promise<Database>((resolve, reject) => {
      const req = indexedDB.open(name, db.version + 1)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
      req.onupgradeneeded = () => req.result.deleteObjectStore(store)
    })

    // Register new DB instance
    this.register(name, newDb)
  }

  /** Delete the entire database. */
  async deleteDatabase(name: DbName) {
    // DB does not exist? -> Done
    const exists = await this.exists(name)
    if (!exists) return

    // Unregister DB
    this.unregister(name)

    // Delete DB
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(name)
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
  private async exists(name: DbName) {
    // Connected to the DB? -> true
    if (this.dbs[name]) return true

    // Check if DB exists
    const dbs = await indexedDB.databases()
    return !!dbs.find(db => db.name === name)
  }

  /** Ensure that the database with the given name exists and returns it. */
  private async ensureDb(name: DbName) {
    // Already connected? -> Just return DB
    if (this.dbs[name]) return this.dbs[name]

    // Get DB version if it exists, or start with version 1
    const dbs = await indexedDB.databases()
    const meta = dbs.find(db => db.name === name)
    const version = meta?.version || 1

    // Create DB / connnect to the existing one
    const db = await new Promise<Database>((resolve, reject) => {
      const req = indexedDB.open(name, version)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })

    // Register DB instance
    this.register(name, db)

    return db
  }

  /** Ensure that the store exists. Returns store's database. */
  private async ensureStore(name: DbName, store: DbStore) {
    // Ensure DB
    const db = await this.ensureDb(name)

    // Store already exists? -> Done
    if (db.objectStoreNames.contains(store)) return db

    // Unregister DB
    this.unregister(name)

    // Create store (new DB instance is created during upgrade)
    const newDb = await new Promise<Database>((resolve, reject) => {
      const req = indexedDB.open(name, db.version + 1)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
      req.onupgradeneeded = () => req.result.createObjectStore(store)
    })

    // Register new DB instance
    this.register(name, newDb)

    return newDb
  }

  private register(name: DbName, db: Database) {
    this.dbs[name] = db

    // 'close' event is fired when closed unexpectedly, e.g. by deleting via devtools
    const onClose = () => delete this.dbs[name]
    db.addEventListener('close', onClose)
    db[_cleanup_] = () => db.removeEventListener('close', onClose)
  }

  private unregister(name: DbName) {
    if (!this.dbs[name]) return
    this.dbs[name].close()
    this.dbs[name][_cleanup_]?.()
    delete this.dbs[name]
  }

  /** Wrap method to be run in a queue for the given database. */
  private enqueue<T extends AsyncFn>(fn: T) {
    return (async (name: DbName, ...args: unknown[]) => {
      const queue = this.queues.ensure(name)
      return await queue.run(() => fn.call(this, name, ...args))
    }) as T
  }
}
