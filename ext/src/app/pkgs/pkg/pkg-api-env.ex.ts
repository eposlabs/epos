export class PkgApiEnv extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!
  tabId = this.$pkg.tabId
  isWeb = !this.$.env.is.exFrameExt
  isPopup = this.$.env.is.exFrameExtPopup
  isSidePanel = this.$.env.is.exFrameExtSidePanel
  isBackground = this.$.env.is.exFrameExtBackground
}
