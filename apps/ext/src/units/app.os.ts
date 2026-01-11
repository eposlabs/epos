export class App extends os.Unit {
  browser = chrome
  utils = new os.Utils(this)
  libs = new osVw.Libs(this)
  env = new gl.Env(this)
  bus = new gl.Bus(this)

  alive = new os.Alive(this)
  dev = new gl.Dev(this)
  peer = new exOs.Peer(this)
  projects = new os.Projects(this)

  async init() {
    self.$ = this
    this.utils.init()
    await this.projects.init()
    await this.dev.init()
  }
}
