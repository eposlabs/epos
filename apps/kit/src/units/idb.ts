import { idb } from 'dropcap/idb'

export class Idb extends gl.Unit {
  declare get: (typeof idb)['get']
  declare has: (typeof idb)['has']
  declare set: (typeof idb)['set']
  declare keys: (typeof idb)['keys']
  declare delete: (typeof idb)['delete']
  declare deleteStore: (typeof idb)['deleteStore']
  declare deleteDatabase: (typeof idb)['deleteDatabase']
  declare listStores: (typeof idb)['listStores']
  declare listDatabases: (typeof idb)['listDatabases']
}

Object.assign(Idb.prototype, {
  get: idb.get.bind(idb),
  has: idb.has.bind(idb),
  set: idb.set.bind(idb),
  keys: idb.keys.bind(idb),
  delete: idb.delete.bind(idb),
  deleteStore: idb.deleteStore.bind(idb),
  deleteDatabase: idb.deleteDatabase.bind(idb),
  listStores: idb.listStores.bind(idb),
  listDatabases: idb.listDatabases.bind(idb),
})
