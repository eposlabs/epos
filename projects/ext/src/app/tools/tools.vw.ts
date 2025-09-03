export class Tools extends $vw.Unit {
  browser = new $vw.ToolsBrowser(this)

  async init() {
    if (!this.$.env.is.vwPermissions) return
    await this.browser.init()
  }
}
