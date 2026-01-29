export class App extends cs.Unit {
  browser = chrome
  utils = new cs.Utils(this)
  libs = new cs.Libs(this)
  env = new gl.Env(this)
  bus = new gl.Bus(this)

  projects = new cs.Projects(this)

  async init() {
    self.$ = this
    await this.bus.initPageToken()
    await this.projects.init()
  }
}
