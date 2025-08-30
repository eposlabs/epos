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
    self.__eposCsReady$ ??= Promise.withResolvers<{ busToken: string }>()
    const busToken = this.bus.getPageToken()
    if (!this.$.is.string(busToken)) throw this.never
    self.__eposCsReady$.resolve({ busToken })
  }
}
