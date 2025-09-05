export class Tools extends $ex.Unit {
  browser = new $ex.ToolsBrowser(this)
  fetcher = new $ex.ToolsFetcher(this)
  logger = new $ex.ToolsLogger(this)

  async init() {
    await this.browser.init()
  }
}
