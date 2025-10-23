export class Idb extends ex.Unit {
  get = this.$.bus.send.bind(this.$.bus, 'idb.get') as sw.Idb['get']
  has = this.$.bus.send.bind(this.$.bus, 'idb.has') as sw.Idb['has']
  set = this.$.bus.send.bind(this.$.bus, 'idb.set') as sw.Idb['set']
  keys = this.$.bus.send.bind(this.$.bus, 'idb.keys') as sw.Idb['keys']
  delete = this.$.bus.send.bind(this.$.bus, 'idb.delete') as sw.Idb['delete']

  listStores = this.$.bus.send.bind(this.$.bus, 'idb.listStores') as sw.Idb['listStores']
  listDatabases = this.$.bus.send.bind(this.$.bus, 'idb.listDatabases') as sw.Idb['listDatabases']
  deleteStore = this.$.bus.send.bind(this.$.bus, 'idb.deleteStore') as sw.Idb['deleteStore']
  deleteDatabase = this.$.bus.send.bind(this.$.bus, 'idb.deleteDatabase') as sw.Idb['deleteDatabase']
}
