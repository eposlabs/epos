export class App extends ex.Unit {
  browser = chrome
  libs = new ex.Libs(this)
  utils = new exOsSwVw.Utils(this)
  is = this.utils.is
  env = new gl.Env(this)
  bus = new gl.Bus(this)

  boot = new ex.Boot(this)
  dev!: gl.Dev
  idb = new ex.Idb(this)
  kit = new ex.Kit(this)
  peer = new exOs.Peer(this)
  projects = new ex.Projects(this)
  states = new exSw.States(this)
  ui = new ex.Ui(this)

  static async init() {
    const i = new this()
    await i.init()
    return i
  }

  private async init() {
    if (this.env.is.dev) self.$epos = this
    await this.boot.injector.inject()
    this.dev = await gl.Dev.init(this)
  }
}
