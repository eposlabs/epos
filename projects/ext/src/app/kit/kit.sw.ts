export class Kit extends $sw.Unit {
  browser = new $sw.KitBrowser(this)
  fetcher = new $sw.KitFetcher(this)
  logger = new $sw.KitLogger(this)
}
