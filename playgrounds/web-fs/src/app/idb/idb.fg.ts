export class Idb extends $fg.Unit {
  name = 'web-fs'
  store = 'keyval'

  declare db: IDBDatabase | null

  async get<T = unknown>(key: string) {
    const db = await this.ensureDb()

    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction([this.store], 'readonly')
      const req = tx.objectStore(this.store).get(key)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }

  async set<T = unknown>(key: string, value: T) {
    const db = await this.ensureDb()

    await new Promise((resolve, reject) => {
      const tx = db.transaction([this.store], 'readwrite')
      const req = tx.objectStore(this.store).put(value, key)
      req.onsuccess = () => resolve(true)
      req.onerror = () => reject(req.error)
      tx.onabort = () => reject(tx.error)
    })
  }

  private async ensureDb() {
    // Already connected? -> Just return DB
    if (this.db) return this.db

    // Get DB version if it exists, or start with version 1
    const dbs = await indexedDB.databases()
    const meta = dbs.find(d => d.name === this.name)
    const version = meta?.version || 1

    // Create DB / connnect to the existing one
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(this.name, version)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
      req.onupgradeneeded = () => req.result.createObjectStore(this.store)
    })

    // Save db reference
    this.db = db

    return db
  }

  static v = {
    1(this: any) {
      delete this.db
    },
  }
}
