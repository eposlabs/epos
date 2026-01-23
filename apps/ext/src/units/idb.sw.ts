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
    this.$.bus.register('Idb[sw]', this)
  }
}
