export type PermissionResult = { id: string; granted: boolean }

export class ToolsBrowser extends $vw.Unit {
  private id = this.$.utils.id()

  async init() {
    if (!this.$.env.is.vwPermissions) return
    this.$.bus.on('tools.requestPermissions', this.requestPermissions, this)
    this.$.bus.on('tools.closePermissionTab', () => self.close())
    await this.$.bus.send('tools.permissionTabReady')
  }

  async requestPermissions(opts: chrome.permissions.Permissions) {
    const [granted, err] = await this.$.utils.safe(this.$.browser.permissions.request(opts))
    self.setTimeout(() => self.close(), 3_000)
    if (err) throw err
    const result: PermissionResult = { id: this.id, granted }
    return result
  }
}
