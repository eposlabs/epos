export class App extends sw.Unit {
  browser = chrome
  utils = new sw.Utils(this)
  libs = new sw.Libs(this)
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
    this.logInfo()
    this.initGlobalMethods()
    await this.setupContentScript()
    await this.createOffscreen()
    await this.reloadKitTabs()
    await this.dev.init()
  }

  private logInfo() {
    const hasDevProject = this.projects.list.some(project => project.mode === 'development')
    if (!hasDevProject) return
    const version = this.browser.runtime.getManifest().version
    const docsUrl = 'https://epos.dev/docs/api'
    const title = `ᛃ epos is running, v${version} ${docsUrl}`
    const subtitle = `To inspect background processes, open offscreen.html from the extension details page`
    this.$.utils.info({ title, subtitle })
  }

  private initGlobalMethods() {
    self.install = (url: Url) => this.projects.install(url)
    self.remove = (id: string) => this.projects.remove(id)
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

  private async reloadKitTabs() {
    // Get kit tabs
    let tabs = await this.browser.tabs.query({ url: 'https://epos.dev/@kit*' })
    tabs = tabs.filter(tab => (tab.url ? new URL(tab.url).pathname === '/@kit' : false))

    for (const tab of tabs) {
      if (!tab.id) continue
      this.browser.tabs.reload(tab.id)
    }
  }
}
