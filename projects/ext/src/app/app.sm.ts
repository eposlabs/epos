export class App extends $sm.Unit {
  browser = chrome
  utils = new $sm.Utils(this)
  is = this.utils.is
  env = new $gl.Env(this)
  bus = new $gl.Bus(this)

  kit = new $sm.Kit(this)

  static async create() {
    const app = new App()
    await app.init()
    return app
  }

  private async init() {
    self.$ = this
    this.$.bus.setSignal(`app.ready[system:${this.env.params.type}]`)
  }
}
