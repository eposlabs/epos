export class App extends $ex.Unit {
  browser = chrome
  libs = new $ex.Libs(this)
  utils = new $exOsSwVw.Utils(this)
  is = this.utils.is
  env = new $gl.Env(this)
  bus = new $gl.Bus(this)

  boot = new $ex.Boot(this)
  dev = new $ex.Dev(this)
  idb = new $ex.Idb(this)
  kit = new $ex.Kit(this)
  peer = new $exOs.Peer(this)
  pkgs = new $ex.Pkgs(this)
  states = new $exSw.States(this)
  ui = new $ex.Ui(this)
  units = new $exSw.Units(this)

  async init() {
    if (this.env.is.dev) self.$epos = this
    await this.dev.init()
    await this.boot.injector.inject()
  }
}
