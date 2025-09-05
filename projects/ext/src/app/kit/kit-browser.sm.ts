export type PermissionResult = { id: string; granted: boolean }

export class KitBrowser extends $sm.Unit {
  private id = this.$.utils.id()

  async init() {
    this.$.bus.on('kit.browser.requestPermissions', this.requestPermissions, this)
    this.$.bus.on('kit.browser.closePermissionTab', () => self.close())
  }

  async requestPermissions(opts: chrome.permissions.Permissions) {
    const [granted, error] = await this.$.utils.safe(this.$.browser.permissions.request(opts))
    self.setTimeout(() => self.close(), 3_000)
    if (error) throw error
    const result: PermissionResult = { id: this.id, granted }
    return result
  }
}
