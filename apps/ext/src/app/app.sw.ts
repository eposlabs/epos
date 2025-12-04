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
    await this.initOffscreen()
    await this.initContentScript()
    await this.reloadDevKitTabs()
    this.initGlobalMethods()
    this.logDevHelp()
    await this.dev.init()
  }

  async exportDevKit() {
    await install('http://localhost:3022/devkit')
    const blob = await eject('devkit')
    const url = await this.$.bus.send<string>('Utils.createObjectUrl', blob)
    this.$.browser.tabs.create({ url, active: true })
  }

  private async initOffscreen() {
    const exists = await this.$.browser.offscreen.hasDocument()
    if (exists) await this.$.browser.offscreen.closeDocument()
    await this.$.browser.offscreen.createDocument({
      url: this.$.env.url.offscreen,
      reasons: ['BLOBS'],
      justification: 'URL.createObjectURL',
    })
  }

  private async initContentScript() {
    // Unregister previous content script
    const contentScripts = await this.$.browser.scripting.getRegisteredContentScripts()
    await this.$.browser.scripting.unregisterContentScripts({ ids: contentScripts.map(cs => cs.id) })

    // Register new content script
    await this.$.browser.scripting.registerContentScripts([
      {
        id: 'cs',
        matches: ['<all_urls>'],
        // Exclude Chrome Web Store iframes
        excludeMatches: [
          'https://ogs.google.com/*',
          'https://*.google.com/static/proxy.html?*',
          'https://accounts.google.com/RotateCookiesPage?*',
        ],
        js: ['/cs.js'],
        runAt: 'document_start',
        world: 'ISOLATED',
        allFrames: true,
      },
    ])
  }

  private async reloadDevKitTabs() {
    const tabs = await this.browser.tabs.query({ url: 'https://epos.dev/@devkit*' })
    for (const tab of tabs) {
      if (!tab.id) continue
      this.browser.tabs.reload(tab.id)
    }
  }

  private initGlobalMethods() {
    self.add = (name: string, dev = false) => this.projects.installer.install(name, dev)
    self.remove = (name: string) => this.projects.installer.remove(name)
    self.eject = (name: string, dev = false) => this.projects.map[name].exporter.export(dev)
    self.install = self.add
  }

  private logDevHelp() {
    const hasDevProject = this.projects.list.some(project => project.dev)
    if (!hasDevProject) return

    const version = chrome.runtime.getManifest().version

    console.log(`ᛃ epos is running, v${version} | https://epos.dev/docs/api`)
    console.log(
      '%cTo inspect <background> process, open offscreen.html from the extension details page',
      'color: gray;',
    )
    console.log('')
  }
}
