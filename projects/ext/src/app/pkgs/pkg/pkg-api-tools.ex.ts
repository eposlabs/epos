export class PkgApiTools extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!

  browser: typeof chrome | null = null
  fetch = this.$.utils.link(this.$.kit.fetcher, 'fetch')
  autorun = this.$.utils.link(this.$.libs.mobx, 'autorun')
  reaction = this.$.utils.link(this.$.libs.mobx, 'reaction')

  async init() {
    this.browser = await this.$.kit.browser.create(this.$pkg.name)
  }
}
