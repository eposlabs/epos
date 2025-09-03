export class App extends $sm.Unit {
  browser = chrome
  utils = new $sm.Utils(this)
  is = this.utils.is
  env = new $gl.Env(this)
  bus = new $gl.Bus(this)

  tools = new $sm.Tools(this)

  async init() {
    self.$ = this
    await this.tools.init()
    this.$.bus.setSignal(`app.ready[system:${this.env.params.type}]`)
  }
}
