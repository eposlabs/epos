export class App extends $os.Unit {
  browser = chrome
  libs = new $osVw.Libs(this)
  utils = new $exOsSwVw.Utils(this)
  is = this.utils.is
  env = new $gl.Env(this)
  bus = new $gl.Bus(this)

  alive = new $os.Alive(this)
  dev!: $gl.Dev
  pack!: $os.Pack
  peer = new $exOs.Peer(this)

  static async create() {
    const app = new App()
    await app.init()
    return app
  }

  private async init() {
    self.$ = this
    this.utils.initOs()
    this.pack = await $os.Pack.create(this)
    this.dev = await $gl.Dev.create(this)
  }
}
