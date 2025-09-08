export type CsReadyData = { busToken: string }

export class App extends $cs.Unit {
  browser = chrome
  utils = new $cs.Utils(this)
  is = this.utils.is
  env = new $gl.Env(this)
  bus = new $gl.Bus(this)

  boot = new $cs.Boot(this)
  dev = new $cs.Dev(this)

  async init() {
    self.$ = this
    self.__eposCsReady$ ??= Promise.withResolvers<CsReadyData>()
    self.__eposCsReady$.resolve({ busToken: this.getBusToken() })
  }

  private getBusToken() {
    const token = this.bus.page.token
    if (!token) throw this.never
    return token
  }
}
