export class App extends sw.Unit {
  browser = chrome
  utils = new sw.Utils(this)
  libs = new sw.Libs(this)
  env = new gl.Env(this)
  bus = new gl.Bus(this)

  alive = new sw.Alive(this)
  idb = new sw.Idb(this)
  medium = new swVw.Medium(this)
  net = new sw.Net(this)
  peer = new sw.Peer(this)
  projects = new sw.Projects(this)
  dashboard = new sw.Dashboard(this)

  async init() {
    self.$ = this
    await this.net.init()
    await this.projects.init()
    this.logInfo()
    this.initGlobalMethods()
    await this.createOffscreen()
    await this.dashboard.reloadTabs()
  }

  private logInfo() {
    if (!this.dashboard.isInstalled()) return
    const title = `ᛃ epos is running | https://epos.dev`
    const subtitle = `To inspect background processes, open offscreen.html from the extension details page`
    this.$.utils.info({ title, subtitle, timestamp: true })
  }

  private initGlobalMethods() {
    self.install = (url: Url, debug = false) => this.projects.install(url, debug)
    self.remove = (id: string) => this.projects.remove(id)
  }

  private async createOffscreen() {
    const exists = await this.browser.offscreen.hasDocument()
    if (exists) await this.browser.offscreen.closeDocument()
    await this.browser.offscreen.createDocument({
      url: this.env.url.offscreen(),
      reasons: ['BLOBS'],
      justification: 'URL.createObjectURL',
    })
  }
}
