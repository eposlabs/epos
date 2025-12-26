export class Idb extends ex.Unit {
  get = this.$.bus.send.bind(this.$.bus, 'Idb.get') as sw.Idb['get']
  has = this.$.bus.send.bind(this.$.bus, 'Idb.has') as sw.Idb['has']
  set = this.$.bus.send.bind(this.$.bus, 'Idb.set') as sw.Idb['set']
  keys = this.$.bus.send.bind(this.$.bus, 'Idb.keys') as sw.Idb['keys']
  delete = this.$.bus.send.bind(this.$.bus, 'Idb.delete') as sw.Idb['delete']
  deleteStore = this.$.bus.send.bind(this.$.bus, 'Idb.deleteStore') as sw.Idb['deleteStore']
  deleteDatabase = this.$.bus.send.bind(this.$.bus, 'Idb.deleteDatabase') as sw.Idb['deleteDatabase']
  listStores = this.$.bus.send.bind(this.$.bus, 'Idb.listStores') as sw.Idb['listStores']
  listDatabases = this.$.bus.send.bind(this.$.bus, 'Idb.listDatabases') as sw.Idb['listDatabases']
}
