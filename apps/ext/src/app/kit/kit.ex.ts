export class Kit extends ex.Unit {
  browser = new ex.KitBrowser(this)
  fetcher = new ex.KitFetcher(this)
  logger = new ex.KitLogger(this)
}
