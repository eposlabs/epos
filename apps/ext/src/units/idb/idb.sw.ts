export class Idb extends sw.Unit {
  private api = new this.$.libs.Idb()
  get = this.$.utils.link(this.api, 'get')
  has = this.$.utils.link(this.api, 'has')
  set = this.$.utils.link(this.api, 'set')
  keys = this.$.utils.link(this.api, 'keys')
  delete = this.$.utils.link(this.api, 'delete')
  deleteStore = this.$.utils.link(this.api, 'deleteStore')
  deleteDatabase = this.$.utils.link(this.api, 'deleteDatabase')
  listStores = this.$.utils.link(this.api, 'listStores')
  listDatabases = this.$.utils.link(this.api, 'listDatabases')

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
