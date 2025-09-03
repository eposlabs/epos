export class Tools extends $ex.Unit {
  browser = new $ex.ToolsBrowser(this)
  fetcher = new $ex.ToolsFetcher(this)

  async init() {
    await this.browser.init()
  }
}
