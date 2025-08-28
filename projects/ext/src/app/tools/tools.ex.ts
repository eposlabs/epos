export class Tools extends $ex.Unit {
  private ext = new $ex.ToolsExt(this)
  private fetcher = new $ex.ToolsFetcher(this)
  fetch = this.$.bind(this.fetcher, 'fetch')

  async init() {
    await this.ext.init()
  }

  getExtApi() {
    return this.ext.api
  }
}
