export class PkgApiTools extends $ex.Unit {
  fetch = this.$.utils.link(this.$.kit.fetcher, 'fetch')
  browser = this.$.kit.browser.api!
  autorun = this.$.utils.link(this.$.libs.mobx, 'autorun')
  reaction = this.$.utils.link(this.$.libs.mobx, 'reaction')
}
