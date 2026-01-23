export class Idb extends ex.Unit {
  private sw = this.$.bus.use<sw.Idb>('Idb[sw]')
  get = this.sw.get as sw.Idb['get']
  has = this.sw.has as sw.Idb['has']
  set = this.sw.set as sw.Idb['set']
  keys = this.sw.keys as sw.Idb['keys']
  delete = this.sw.delete as sw.Idb['delete']
  deleteStore = this.sw.deleteStore as sw.Idb['deleteStore']
  deleteDatabase = this.sw.deleteDatabase as sw.Idb['deleteDatabase']
  listStores = this.sw.listStores as sw.Idb['listStores']
  listDatabases = this.sw.listDatabases as sw.Idb['listDatabases']
}
