export class PkgApiEnv extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!
  tabId = this.$pkg.tabId

  is = {
    tab: this.$.env.is.exTab,
    shell: this.$.env.is.exFrameExtPopup || this.$.env.is.exFrameExtPanel,
    popup: this.$.env.is.exFrameExtPopup,
    panel: this.$.env.is.exFrameExtPanel,
    background: this.$.env.is.exFrameExtBackground,
    foreground: !this.$.env.is.exFrameExtBackground,
  }
}
