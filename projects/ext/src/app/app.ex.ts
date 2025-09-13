export class App extends $ex.Unit {
  browser = chrome
  libs = new $ex.Libs(this)
  utils = new $exOsSwVw.Utils(this)
  is = this.utils.is
  env = new $gl.Env(this)
  bus = new $gl.Bus(this)

  boot = new $ex.Boot(this)
  idb = new $ex.Idb(this)
  kit = new $ex.Kit(this)
  peer = new $exOs.Peer(this)
  pack = new $ex.Pack(this)
  states = new $exSw.States(this)
  ui = new $ex.Ui(this)
  units = new $exSw.Units(this)

  dev!: $ex.Dev

  static async create() {
    const app = new App()
    await app.init()
    return app
  }

  private async init() {
    if (this.env.is.dev) self.$epos = this
    this.dev = await $ex.Dev.create(this)
    await this.boot.injector.inject()
  }
}
