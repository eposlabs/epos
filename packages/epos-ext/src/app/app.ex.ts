export class App extends $ex.Unit {
  private ready$ = Promise.withResolvers<void>()

  browser = chrome
  libs = new $ex.Libs(this)
  utils = new $exOsSwVw.Utils(this)
  is = this.utils.is
  safe = this.utils.safe
  bind = this.utils.bind
  env = new $gl.Env(this)
  bus = new $gl.Bus(this)

  boot = new $ex.Boot(this)
  dev = new $ex.Dev(this)
  idb = new $ex.Idb(this)
  peer = new $exOs.Peer(this)
  pkgs = new $ex.Pkgs(this)
  store = new $exSw.Store(this)
  tools = new $ex.Tools(this)
  ui = new $ex.Ui(this)

  async init() {
    if (this.env.is.dev) self.$epos = this
    await this.tools.init()
    await this.pkgs.init()
    await this.dev.init()
    this.ready$.resolve()
  }

  async waitReady() {
    await this.ready$.promise
  }
}
