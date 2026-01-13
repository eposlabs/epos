export type PermissionResult = { id: string; granted: boolean }

export class ToolsBrowser extends sm.Unit {
  private id = this.$.utils.id()

  constructor(parent: sm.Unit) {
    super(parent)
    this.$.bus.on('ToolsBrowser.requestPermissions', this.requestPermissions, this)
    this.$.bus.on('ToolsBrowser.closePermissionTab', () => self.close())
  }

  async requestPermissions(opts: chrome.permissions.Permissions) {
    const [granted, error] = await this.$.utils.safe(this.$.browser.permissions.request(opts))
    setTimeout(() => self.close(), 3_000)
    if (error) throw error
    const result: PermissionResult = { id: this.id, granted }
    return result
  }
}
