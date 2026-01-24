import type { PermissionQuery } from 'epos/browser'

export class App extends pm.Unit {
  browser = chrome
  utils = new pm.Utils(this)
  env = new gl.Env(this)
  bus = new gl.Bus(this)

  async init() {
    self.$ = this
    this.$.bus.on('App.requestPermissions', this.request, this)
    this.$.bus.setSignal(`App.ready[permission]`)
  }

  private async request(query: PermissionQuery) {
    const [granted, error] = await this.$.utils.safe(() => this.$.browser.permissions.request(query))
    setTimeout(() => self.close(), 3_000)
    if (error) throw error
    return granted
  }
}
