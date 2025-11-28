export class App extends ex.Unit {
  browser = chrome
  libs = new ex.Libs(this)
  utils = new exOsSwVw.Utils(this)
  env = new gl.Env(this)
  bus = new gl.Bus(this)

  dev = new gl.Dev(this)
  idb = new ex.Idb(this)
  peer = new exOs.Peer(this)
  projects = new ex.Projects(this)
  states = new exSw.States(this)
  tools = new ex.Tools(this)
  ui = new ex.Ui(this)

  async init() {
    if (this.env.is.dev) self.$epos = this
    await this.projects.init()
    await this.dev.init()
  }
}
