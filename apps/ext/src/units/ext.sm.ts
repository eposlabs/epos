export type PermissionResult = { id: string; granted: boolean }

export class Ext extends sm.Unit {
  private id = this.$.utils.id()

  constructor(parent: sm.Unit) {
    super(parent)
    this.$.bus.on('Ext.requestPermissions', this.requestPermissions, this)
    this.$.bus.on('Ext.closePermissionTab', () => self.close())
  }

  async requestPermissions(opts: chrome.permissions.Permissions) {
    const [granted, error] = await this.$.utils.safe(this.$.browser.permissions.request(opts))
    setTimeout(() => self.close(), 3_000)
    if (error) throw error
    const result: PermissionResult = { id: this.id, granted }
    return result
  }
}
