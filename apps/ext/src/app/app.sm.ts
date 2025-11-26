export class App extends sm.Unit {
  browser = chrome
  utils = new sm.Utils(this)
  env = new gl.Env(this)
  bus = new gl.Bus(this)

  dev = new gl.Dev(this)
  kit = new sm.Kit(this)

  async init() {
    self.$ = this
    this.$.bus.setSignal(`app.ready[system:${this.env.params.type}]`)
    await this.dev.init()
  }
}
