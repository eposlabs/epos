export class PkgApiEnv extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!
  tabId = this.$pkg.tabId

  is = {
    tab: this.$.env.is.exTab,
    hub: this.$.env.is.exTabHub,
    page: this.$.env.is.exTabPage,
    shell: this.$.env.is.exFramePopup || this.$.env.is.exFramePanel,
    popup: this.$.env.is.exFramePopup,
    panel: this.$.env.is.exFramePanel,
    background: this.$.env.is.exFrameBackground,
    foreground: !this.$.env.is.exFrameBackground,
  }
}
