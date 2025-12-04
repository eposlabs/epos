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
    await install('http://localhost:3022/devkit')
    const blob = await eject('devkit')
    const url = await this.$.bus.send<string>('Utils.createObjectUrl', blob)
    this.$.browser.tabs.create({ url, active: true })
  }

  private logDevHelp() {
    const hasDevProject = this.projects.list.some(project => project.dev)
    if (!hasDevProject) return

    const version = chrome.runtime.getManifest().version
    console.log(
      [
        `%cᛃ epos ${version} https://epos.dev/docs/api`,
        '%c\n',
        `%cTo inspect <background> process, open offscreen.html from the extension details page`,
      ].join(''),
      'border-left: 2px solid #d7eb00; padding-left: 8px; padding-top: 1px; padding-bottom: 4px;',
      '',
      'border-left: 2px solid #d7eb00; padding-left: 8px; padding-bottom: 1px; margin-bottom: 8px; color: gray;',
    )
  }

  private initGlobalMethods() {
    self.add = (name: string, dev = false) => this.projects.installer.install(name, dev)
    self.remove = (name: string) => this.projects.installer.remove(name)
    self.eject = (name: string, dev = false) => this.projects.map[name].exporter.export(dev)
    self.install = self.add
  }

  private async setupContentScript() {
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

  private async createOffscreen() {
    const exists = await this.$.browser.offscreen.hasDocument()
    if (exists) await this.$.browser.offscreen.closeDocument()
    await this.$.browser.offscreen.createDocument({
      url: this.$.env.url.offscreen,
      reasons: ['BLOBS'],
      justification: 'URL.createObjectURL',
    })
  }

  private async reloadDevKitTabs() {
    const tabs = await this.browser.tabs.query({ url: 'https://epos.dev/@devkit*' })
    for (const tab of tabs) {
      if (!tab.id) continue
      this.browser.tabs.reload(tab.id)
    }
  }
}
