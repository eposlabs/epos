export type CsReadyData = { busToken: string }

export class App extends $cs.Unit {
  browser = chrome
  utils = new $cs.Utils(this)
  is = this.utils.is
  env = new $gl.Env(this)
  bus = new $gl.Bus(this)

  boot = new $cs.Boot(this)
  dev!: $gl.Dev

  static async create() {
    const app = new App()
    await app.init()
    return app
  }

  private async init() {
    self.$ = this
    self.__eposCsReady$ ??= Promise.withResolvers<CsReadyData>()
    self.__eposCsReady$.resolve({ busToken: this.getBusToken() })
    await this.boot.injector.inject()
    this.dev = await $gl.Dev.create(this)
  }

  private getBusToken() {
    return null
    // const token = this.bus.page.token
    // if (!token) throw this.never
    // return token
  }
}
