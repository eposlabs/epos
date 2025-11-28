export type CsReadyData = { busToken: string | null }

export class App extends cs.Unit {
  browser = chrome
  utils = new cs.Utils(this)
  env = new gl.Env(this)
  bus = new gl.Bus(this)

  dev = new gl.Dev(this)
  projects = new cs.Projects(this)

  async init() {
    self.$ = this
    self.__eposCsReady$ ??= Promise.withResolvers<CsReadyData>()
    self.__eposCsReady$.resolve({ busToken: this.getBusToken() })
    await this.projects.init()
    await this.dev.init()
  }

  private getBusToken() {
    return null
    // const token = this.bus.page.token
    // if (!token) throw this.never()
    // return token
  }
}
