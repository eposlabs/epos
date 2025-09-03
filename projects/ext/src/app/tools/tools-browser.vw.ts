export type PermissionsResult = { id: string; granted: boolean }

export class ToolsBrowser extends $vw.Unit {
  private id = this.$.utils.id()

  async init() {
    if (!this.$.env.is.vwPermissions) return
    this.$.bus.on('tools.requestPermissions', this.requestPermissions, this)
    this.$.bus.on('tools.closePermissionsTab', () => self.close())
    await this.$.bus.send('tools.permissionsReady')
  }

  async requestPermissions(opts: chrome.permissions.Permissions) {
    const [granted, err] = await this.$.utils.safe(this.$.browser.permissions.request(opts))
    self.setTimeout(() => self.close(), 3_000)
    if (err) throw err
    const result: PermissionsResult = { id: this.id, granted }
    return result
  }
}
