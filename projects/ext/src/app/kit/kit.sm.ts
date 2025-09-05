export class Kit extends $sm.Unit {
  browser = new $sm.KitBrowser(this)

  async init() {
    await this.browser.init()
  }
}
