import type { ActionShard, InvokeShard } from './pkg/pkg.sw'

export type ActionShards = { [name: string]: ActionShard }
export type InvokeShards = { [name: string]: InvokeShard }

export class Pkgs extends $sw.Unit {
  map: { [name: string]: $sw.Pkg } = {}
  loader = new $sw.PkgsLoader(this)
  parser = new $sw.PkgsParser(this)
  installer = new $sw.PkgsInstaller(this)

  get list() {
    return Object.values(this.map)
  }

  constructor(parent: $sw.Unit) {
    super(parent)
    this.$.bus.on('pkgs.test', this.test, this)
    this.$.bus.on('pkgs.getCss', this.getCss, this)
    this.$.bus.on('pkgs.getLiteJs', this.getLiteJs, this)
    this.$.bus.on('pkgs.getPayloads', this.getPayloads, this)
    this.$.bus.on('pkgs.getActionShards', this.getActionShards, this)
    this.$.bus.on('pkgs.getInvokeShards', this.getInvokeShards, this)
  }

  async init() {
    await this.loader.init()
    await this.restoreFromIdb()
  }

  test(uri: string) {
    return this.list.some(pkg => pkg.test(uri))
  }

  getCss(uri: string) {
    return this.list
      .map(pkg => pkg.getCss(uri))
      .filter(this.$.is.present)
      .join('\n')
      .trim()
  }

  getLiteJs(uri: string) {
    return this.list
      .map(pkg => pkg.getLiteJs(uri))
      .filter(this.$.is.present)
      .join('\n')
      .trim()
  }

  getPayloads(uri: string) {
    return this.list.map(pkg => pkg.getPayload(uri)).filter(this.$.is.present)
  }

  getActionShards() {
    const shards: ActionShards = {}
    for (const pkg of this.list) {
      const shard = pkg.getActionShard()
      if (!shard) continue
      shards[pkg.name] = shard
    }

    return shards
  }

  private async getInvokeShards(uri: string) {
    const shards: InvokeShards = {}
    for (const pkg of this.list) {
      const shard = await pkg.getInvokeShard(uri)
      if (!shard) continue
      shards[pkg.name] = shard
    }

    return shards
  }

  private async restoreFromIdb() {
    const names = await this.$.idb.listDatabases()
    for (const name of names) {
      const pkg = await $sw.Pkg.restore(this, name)
      if (!pkg) continue
      this.map[name] = pkg
    }
  }
}
