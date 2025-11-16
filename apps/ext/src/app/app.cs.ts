export type CsReadyData = { busToken: string | null }

export class App extends cs.Unit {
  browser = chrome
  utils = new cs.Utils(this)
  is = this.utils.is
  env = new gl.Env(this)
  bus = new gl.Bus(this)

  boot = new cs.Boot(this)
  dev!: gl.Dev

  static async init() {
    const i = new this()
    await i.init()
    return i
  }

  private async init() {
    self.$ = this
    self.__eposCsReady$ ??= Promise.withResolvers<CsReadyData>()
    self.__eposCsReady$.resolve({ busToken: this.getBusToken() })
    await this.boot.injector.inject()
    this.dev = await gl.Dev.init(this)
  }

  private getBusToken() {
    return null
    // const token = this.bus.page.token
    // if (!token) throw this.never
    // return token
  }
}
