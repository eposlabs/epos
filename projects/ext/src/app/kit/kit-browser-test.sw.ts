export class KitBrowserTest extends $sw.Unit {
  constructor(parent: $sw.Unit) {
    super(parent)
    this.$.bus.on('kit.testApi', this.testApi, this)
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
