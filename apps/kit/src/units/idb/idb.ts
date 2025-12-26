export class Idb extends gl.Unit {
  declare get: InstanceType<typeof this.$.libs.Idb>['get']
  declare has: InstanceType<typeof this.$.libs.Idb>['has']
  declare set: InstanceType<typeof this.$.libs.Idb>['set']
  declare keys: InstanceType<typeof this.$.libs.Idb>['keys']
  declare delete: InstanceType<typeof this.$.libs.Idb>['delete']
  declare deleteStore: InstanceType<typeof this.$.libs.Idb>['deleteStore']
  declare deleteDatabase: InstanceType<typeof this.$.libs.Idb>['deleteDatabase']
  declare listStores: InstanceType<typeof this.$.libs.Idb>['listStores']
  declare listDatabases: InstanceType<typeof this.$.libs.Idb>['listDatabases']
  declare private api: InstanceType<typeof this.$.libs.Idb>

  init() {
    this.api = new this.$.libs.Idb()
    this.get = this.$.utils.link(this.api, 'get')
    this.has = this.$.utils.link(this.api, 'has')
    this.set = this.$.utils.link(this.api, 'set')
    this.keys = this.$.utils.link(this.api, 'keys')
    this.delete = this.$.utils.link(this.api, 'delete')
    this.deleteStore = this.$.utils.link(this.api, 'deleteStore')
    this.deleteDatabase = this.$.utils.link(this.api, 'deleteDatabase')
    this.listStores = this.$.utils.link(this.api, 'listStores')
    this.listDatabases = this.$.utils.link(this.api, 'listDatabases')
  }
}
