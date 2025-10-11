export class App extends sw.Unit {
  browser = chrome
  libs = new sw.Libs(this)
  utils = new exOsSwVw.Utils(this)
  is = this.utils.is
  env = new gl.Env(this)
  bus = new gl.Bus(this)

  alive = new sw.Alive(this)
  boot!: sw.Boot
  dev!: gl.Dev
  idb = new sw.Idb(this)
  kit = new sw.Kit(this)
  net!: sw.Net
  peer = new sw.Peer(this)
  projects!: sw.Projects
  states = new exSw.States(this)

  static async create() {
    const app = new App()
    await app.init()
    return app
  }

  private async init() {
    self.$ = this
    this.net = await sw.Net.create(this)
    this.projects = await sw.Projects.create(this)
    this.boot = await sw.Boot.create(this)
    await this.setupContentScript()
    await this.setupOffscreen()
    this.defineGlobalMethods()
    this.dev = await gl.Dev.create(this)

    if (
      this.projects.list().length === 0 ||
      this.projects.list().some(project => project.dev) ||
      this.projects.list().some(project => project.name === 'devkit')
    ) {
      console.log('ᛃ epos is running | https://epos.dev/docs/api')
      console.log(
        '%cTo inspect <background> process, open offscreen.html from the extension details page',
        'color: gray;',
      )
      console.log('')
    }
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
        js: ['/cs.js'],
        // Exclude Chrome Web Store iframes
        excludeMatches: [
          'https://ogs.google.com/*',
          'https://*.google.com/static/proxy.html?*',
          'https://accounts.google.com/RotateCookiesPage?*',
        ],
        runAt: 'document_start',
        world: 'ISOLATED',
        allFrames: true,
      },
    ])
  }

  private async setupOffscreen() {
    const exists = await this.$.browser.offscreen.hasDocument()
    if (exists) await this.$.browser.offscreen.closeDocument()
    await this.$.browser.offscreen.createDocument({
      url: this.$.env.url.offscreen,
      reasons: ['BLOBS'],
      justification: 'URL.createObjectURL',
    })
  }

  private defineGlobalMethods() {
    self.add = (name: string, dev = false) => this.projects.installer.install(name, dev)
    self.remove = (name: string) => this.projects.installer.remove(name)
    self.eject = (name: string) => this.projects.map[name].exporter.export()
    self.install = self.add
  }

  async export() {
    await install('http://localhost:3022/devkit')
    const blob = await eject('devkit')
    const url = await $.bus.send('utils.createObjectUrl', blob)
    this.$.browser.tabs.create({ url, active: true })
  }
}
