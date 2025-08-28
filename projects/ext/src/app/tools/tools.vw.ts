export class Tools extends $vw.Unit {
  private ext = new $vw.ToolsExt(this)

  async init() {
    if (!this.$.env.is.vwPermissions) return
    await this.ext.init()
  }
}
