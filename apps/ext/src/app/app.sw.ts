export class App extends sw.Unit {
  browser = chrome
  libs = new sw.Libs(this)
  utils = new exOsSwVw.Utils(this)
  env = new gl.Env(this)
  bus = new gl.Bus(this)

  alive = new sw.Alive(this)
  dev = new gl.Dev(this)
  idb = new sw.Idb(this)
  net = new sw.Net(this)
  peer = new sw.Peer(this)
  projects = new sw.Projects(this)
  tools = new sw.Tools(this)

  async init() {
    self.$ = this
    await this.net.init()
    await this.projects.init()
    this.logDevHelp()
    this.initGlobalMethods()
    await this.setupContentScript()
    await this.createOffscreen()
    await this.reloadDevKitTabs()
    await this.dev.init()
  }

  async exportDevKit() {
    await this.projects.install('http://localhost:3022/apps/devkit/epos.json')
    const blob = await this.projects.export('devkit')
    const url = await this.bus.send<string>('Utils.createObjectUrl', blob)
    await this.browser.tabs.create({ url, active: true })
  }

  private logDevHelp() {
    const hasDevProject = this.projects.list.some(project => project.env === 'development')
    if (!hasDevProject) return
    const version = this.browser.runtime.getManifest().version
    const docsUrl = 'https://epos.dev/docs/api'
    const message = `ᛃ epos is running, v${version} ${docsUrl}`
    const details = 'To inspect <background> process, open offscreen.html from the extension details page'
    this.$.utils.info(message, { details })
  }

  private initGlobalMethods() {
    self.eject = (name: string, asDev = false) => this.projects.map[name].zip(asDev)
    self.remove = (name: string) => this.projects.remove(name)
    self.install = (name: string, asDev = false) => this.projects.install(name, asDev)
  }

  private async setupContentScript() {
    const CHROME_WEB_STORE_IFRAMES = [
      'https://ogs.google.com/*',
      'https://*.google.com/static/proxy.html?*',
      'https://accounts.google.com/RotateCookiesPage?*',
    ]

    // Unregister previous content script
    const contentScripts = await this.browser.scripting.getRegisteredContentScripts()
    await this.browser.scripting.unregisterContentScripts({ ids: contentScripts.map(cs => cs.id) })

    // Register new content script
    await this.browser.scripting.registerContentScripts([
      {
        id: 'cs',
        matches: ['<all_urls>'],
        js: ['/cs.js'],
        world: 'ISOLATED',
        runAt: 'document_start',
        allFrames: true,
        excludeMatches: CHROME_WEB_STORE_IFRAMES,
      },
    ])
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

  private async reloadDevKitTabs() {
    // Get devkit tabs
    let tabs = await this.browser.tabs.query({ url: 'https://epos.dev/@devkit*' })
    tabs = tabs.filter(tab => (tab.url ? new URL(tab.url).pathname === '/@devkit' : false))

    for (const tab of tabs) {
      if (!tab.id) continue
      this.browser.tabs.reload(tab.id)
    }
  }
}
