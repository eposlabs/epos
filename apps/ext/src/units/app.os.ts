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
    this.logOffscreenLabel()
    await this.projects.init()
    await this.dev.init()
  }

  private logOffscreenLabel() {
    console.log(`%coffscreen.html`, 'padding: 4px 8px; margin: 12px 0; border: 1px dotted #9ca3af; border-radius: 6px;')
  }
}
