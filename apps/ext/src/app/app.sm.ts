export class App extends sm.Unit {
  browser = chrome
  utils = new sm.Utils(this)
  is = this.utils.is
  env = new gl.Env(this)
  bus = new gl.Bus(this)

  dev!: gl.Dev
  kit = new sm.Kit(this)

  static async init() {
    const i = new this()
    await i.init()
    return i
  }

  private async init() {
    self.$ = this
    this.$.bus.setSignal(`app.ready[system:${this.env.params.type}]`)
    this.dev = await gl.Dev.init(this)
  }
}
