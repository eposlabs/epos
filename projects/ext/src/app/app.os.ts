export class App extends $os.Unit {
  browser = chrome
  libs = new $osVw.Libs(this)
  utils = new $exOsSwVw.Utils(this)
  is = this.utils.is
  env = new $gl.Env(this)
  bus = new $gl.Bus(this)

  alive = new $os.Alive(this)
  dev = new $os.Dev(this)
  peer = new $exOs.Peer(this)
  pkgs!: $os.Pkgs

  static async create() {
    const app = new App()
    await app.init()
    return app
  }

  private async init() {
    self.$ = this
    this.utils.initOs()
    this.pkgs = await $os.Pkgs.create(this)
  }
}
