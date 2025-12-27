export class Idb extends gl.Unit {
  declare get: (typeof this.$.libs.idb)['get']
  declare has: (typeof this.$.libs.idb)['has']
  declare set: (typeof this.$.libs.idb)['set']
  declare keys: (typeof this.$.libs.idb)['keys']
  declare delete: (typeof this.$.libs.idb)['delete']
  declare deleteStore: (typeof this.$.libs.idb)['deleteStore']
  declare deleteDatabase: (typeof this.$.libs.idb)['deleteDatabase']
  declare listStores: (typeof this.$.libs.idb)['listStores']
  declare listDatabases: (typeof this.$.libs.idb)['listDatabases']

  init() {
    this.get = this.$.utils.link(this.$.libs.idb, 'get')
    this.has = this.$.utils.link(this.$.libs.idb, 'has')
    this.set = this.$.utils.link(this.$.libs.idb, 'set')
    this.keys = this.$.utils.link(this.$.libs.idb, 'keys')
    this.delete = this.$.utils.link(this.$.libs.idb, 'delete')
    this.deleteStore = this.$.utils.link(this.$.libs.idb, 'deleteStore')
    this.deleteDatabase = this.$.utils.link(this.$.libs.idb, 'deleteDatabase')
    this.listStores = this.$.utils.link(this.$.libs.idb, 'listStores')
    this.listDatabases = this.$.utils.link(this.$.libs.idb, 'listDatabases')
  }
}
