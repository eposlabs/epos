export class PkgApiEnv extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!
  tabId = this.$pkg.tabId
  isWeb = this.$.env.is.exFrameWeb
  isPopup = this.$.env.is.exFramePopup
  isSidePanel = this.$.env.is.exFrameSidePanel
  isBackground = this.$.env.is.exFrameBackground
}
