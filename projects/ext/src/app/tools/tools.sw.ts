export class Tools extends $sw.Unit {
  browser = new $sw.ToolsBrowser(this)
  fetcher = new $sw.ToolsFetcher(this)
  logger = new $sw.ToolsLogger(this)
}
