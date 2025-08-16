export class Idb extends $ex.Unit {
  get = this.link('idb.get') as $sw.Idb['get']
  has = this.link('idb.has') as $sw.Idb['has']
  set = this.link('idb.set') as $sw.Idb['set']
  keys = this.link('idb.keys') as $sw.Idb['keys']
  delete = this.link('idb.delete') as $sw.Idb['delete']

  listStores = this.link('idb.listStores') as $sw.Idb['listStores']
  listDatabases = this.link('idb.listDatabases') as $sw.Idb['listDatabases']
  deleteStore = this.link('idb.deleteStore') as $sw.Idb['deleteStore']
  deleteDatabase = this.link('idb.deleteDatabase') as $sw.Idb['deleteDatabase']

  private link(method: string) {
    return this.$.bus.send.bind(this.$.bus, method)
  }
}
