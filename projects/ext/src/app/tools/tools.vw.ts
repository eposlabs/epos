export class Tools extends $vw.Unit {
  ext = new $vw.ToolsExt(this)

  async init() {
    if (!this.$.env.is.vwPermissions) return
    await this.ext.init()
  }
}
