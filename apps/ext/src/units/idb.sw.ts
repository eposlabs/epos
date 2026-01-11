export class Idb extends sw.Unit {
  get = this.$.utils.link(this.$.libs.idb, 'get')
  has = this.$.utils.link(this.$.libs.idb, 'has')
  set = this.$.utils.link(this.$.libs.idb, 'set')
  keys = this.$.utils.link(this.$.libs.idb, 'keys')
  delete = this.$.utils.link(this.$.libs.idb, 'delete')
  deleteStore = this.$.utils.link(this.$.libs.idb, 'deleteStore')
  deleteDatabase = this.$.utils.link(this.$.libs.idb, 'deleteDatabase')
  listStores = this.$.utils.link(this.$.libs.idb, 'listStores')
  listDatabases = this.$.utils.link(this.$.libs.idb, 'listDatabases')

  constructor(parent: sw.Unit) {
    super(parent)

    this.$.bus.on('Idb.get', this.get, this)
    this.$.bus.on('Idb.has', this.has, this)
    this.$.bus.on('Idb.set', this.set, this)
    this.$.bus.on('Idb.keys', this.keys, this)
    this.$.bus.on('Idb.delete', this.delete, this)

    this.$.bus.on('Idb.listStores', this.listStores, this)
    this.$.bus.on('Idb.listDatabases', this.listDatabases, this)
    this.$.bus.on('Idb.deleteStore', this.deleteStore, this)
    this.$.bus.on('Idb.deleteDatabase', this.deleteDatabase, this)
  }
}
