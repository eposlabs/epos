import type { PermissionQuery } from 'epos/browser'

export class Permissions extends sm.Unit {
  constructor(parent: sm.Unit) {
    super(parent)
    this.$.bus.on('Permissions.request', this.request, this)
  }

  private async request(query: PermissionQuery) {
    const [granted, error] = await this.$.utils.safe(() => this.$.browser.permissions.request(query))
    setTimeout(() => self.close(), 3_000)
    if (error) throw error
    return granted
  }
}
