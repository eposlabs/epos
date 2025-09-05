export class App extends $sw.Unit {
  browser = chrome
  libs = new $sw.Libs(this)
  utils = new $exOsSwVw.Utils(this)
  is = this.utils.is
  env = new $gl.Env(this)
  bus = new $gl.Bus(this)
  dev = new $sw.Dev(this)

  alive = new $sw.Alive(this)
  boot = new $sw.Boot(this)
  idb = new $sw.Idb(this)
  kit = new $sw.Kit(this)
  net = new $sw.Net(this)
  peer = new $sw.Peer(this)
  pkgs = new $sw.Pkgs(this)
  states = new $exSw.States(this)
  units = new $exSw.Units(this)

  async init() {
    self.$ = this
    await this.net.init()
    await this.pkgs.init()
    await this.boot.init()
    await this.initContentScript()
    await this.initOffscreen()
    await this.dev.init()
    self.add = (name: string, dev = false) => this.pkgs.installer.install(name, dev)
    self.remove = (name: string) => this.pkgs.installer.remove(name)
    self.eject = (name: string) => this.pkgs.map[name].exporter.export()
  }

  private async initContentScript() {
    // Unregister previous content script if any
    const contentScripts = await this.$.browser.scripting.getRegisteredContentScripts()
    await this.$.browser.scripting.unregisterContentScripts({
      ids: contentScripts.map(contentScript => contentScript.id),
    })

    // Register new content script
    await this.$.browser.scripting.registerContentScripts([
      {
        id: 'cs',
        matches: ['<all_urls>'],
        js: ['/cs.js'],
        runAt: 'document_start',
        world: 'ISOLATED',
        allFrames: false,
      },
    ])
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
}

// setTimeout(() => {
//   chrome.tabs.create({
//     url: 'chrome-extension://mmnaolanbicijjnlkbpgbbamblkkdghc/view.html',
//     active: true,
//   })
// }, 20)

// await this.peer.mutex('start', async () => {
//   await this.allowHub()
// })

// private async allowHub() {
//   await this.$.net.register({
//     urlFilter: `${this.$.env.url.hubDev}/*`,
//     responseHeaders: { 'Access-Control-Allow-Origin': '*' },
//   })
//   await this.$.net.register({
//     urlFilter: `${this.$.env.url.hubProd}/*`,
//     responseHeaders: { 'Access-Control-Allow-Origin': '*' },
//   })
// }
