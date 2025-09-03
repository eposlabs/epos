export class PkgApiTools extends $ex.Unit {
  fetch = this.$.utils.link(this.$.tools.fetcher, 'fetch')
  browser = this.$.tools.browser.api!
  autorun = this.$.utils.link(this.$.libs.mobx, 'autorun')
  reaction = this.$.utils.link(this.$.libs.mobx, 'reaction')
}
