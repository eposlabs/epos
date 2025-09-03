export class Dev extends $sw.Unit {
  declare units: $gl.DevUnits
  declare store: $exSw.DevStore

  constructor(parent: $sw.Unit) {
    super(parent)
    this.units = new $gl.DevUnits(this)
    this.store = new $exSw.DevStore(this)
  }

  async init() {
    // this.initViewTab()
    await this.store.init()
  }

  initViewTab() {
    if (import.meta.env.PROD) return

    chrome.tabs.create({
      url: this.$.browser.runtime.getURL('/view.html?type=panel'),
      active: true,
    })
  }
}
