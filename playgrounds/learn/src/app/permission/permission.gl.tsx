export class Permission extends $gl.Unit {
  name: chrome.runtime.ManifestPermissions
  granted = false

  constructor(name: chrome.runtime.ManifestPermissions) {
    super()
    this.name = name
  }

  async init() {
    await this.updateGranted()
  }

  async test() {
    await (epos as any).engine.bus.send('dev.testApi', this.name)
  }

  async request() {
    await epos.browser.permissions.request({ permissions: [this.name] })
    await this.updateGranted()
  }

  private async updateGranted() {
    this.granted = await epos.browser.permissions.contains({ permissions: [this.name] })
  }
}
