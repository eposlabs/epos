export type PermissionResult = { id: string; granted: boolean }

export class ToolsBrowser extends sm.Unit {
  private id = this.$.utils.id()

  constructor(parent: sm.Unit) {
    super(parent)
    this.$.bus.on('tools.browser.requestPermissions', this.requestPermissions, this)
    this.$.bus.on('tools.browser.closePermissionTab', () => self.close())
  }

  async requestPermissions(opts: chrome.permissions.Permissions) {
    const [granted, error] = await this.$.utils.safe(this.$.browser.permissions.request(opts))
    self.setTimeout(() => self.close(), 3_000)
    if (error) throw error
    const result: PermissionResult = { id: this.id, granted }
    return result
  }
}
