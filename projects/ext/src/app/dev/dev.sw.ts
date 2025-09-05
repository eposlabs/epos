export class Dev extends $sw.Unit {
  declare units: $gl.DevUnits
  declare store: $exSw.DevStore

  constructor(parent: $sw.Unit) {
    super(parent)
    // this.units = new $gl.DevUnits(this)
    // this.store = new $exSw.DevStore(this)
    this.$.bus.on('dev.testApi', this.testApi, this)
  }

  async init() {
    // this.initViewTab()
    // await this.store.init()
  }

  initViewTab() {
    if (import.meta.env.PROD) return

    chrome.tabs.create({
      url: this.$.browser.runtime.getURL('/view.html?type=panel'),
      active: true,
    })
  }

  private async testApi(name: string) {
    if (name === 'downloads') {
      await this.testDownloads()
    } else if (name === 'notifications') {
      await this.testNotifications()
    } else if (name === 'cookies') {
      await this.testCookies()
    }
  }

  private async testDownloads() {
    const blob = new Blob(['test-file'], { type: 'text/plain' })
    const url = await this.$.bus.send<string>('utils.createObjectUrl', blob)
    await chrome.downloads.download({ url: url, filename: 'test-file.txt' })
    await this.$.bus.send('utils.revokeObjectUrl', url)
  }

  private async testNotifications() {
    await chrome.notifications.create(this.$.utils.id(), {
      type: 'basic',
      iconUrl: '/icon.png',
      title: 'Test Notification',
      message: 'This is a test notification',
    })
  }

  private async testCookies() {
    await this.$.browser.cookies.set({
      url: 'https://epos.dev',
      name: 'epos:checked',
      value: 'true',
      expirationDate: Date.now() / 1000 + 60 * 60 * 24 * 30,
    })
  }
}
