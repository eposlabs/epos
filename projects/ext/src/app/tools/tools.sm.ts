export class Tools extends $sm.Unit {
  browser = new $sm.ToolsBrowser(this)

  async init() {
    await this.browser.init()
  }
}
