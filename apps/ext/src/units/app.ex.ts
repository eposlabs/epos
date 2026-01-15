export class App extends ex.Unit {
  browser = chrome
  utils = new ex.Utils(this)
  libs = new ex.Libs(this)
  env = new gl.Env(this)
  bus = new gl.Bus(this)

  dev = new gl.Dev(this)
  ext = new ex.Ext(this)
  fetcher = new ex.Fetcher(this)
  idb = new ex.Idb(this)
  peer = new exOs.Peer(this)
  projects = new ex.Projects(this)

  async init() {
    if (this.$.env.is.dev) self.$epos = this
    await this.bus.initTabToken()
    await this.projects.init()
    await this.dev.init()
  }
}
