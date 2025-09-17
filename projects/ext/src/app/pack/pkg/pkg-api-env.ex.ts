export class PkgApiEnv extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!
  tabId = this.$pkg.tabId
  isTab = this.$.env.is.exTab
  isShell = this.$.env.is.exFrameExtPopup || this.$.env.is.exFrameExtPanel
  isPopup = this.$.env.is.exFrameExtPopup
  isPanel = this.$.env.is.exFrameExtPanel
  isBackground = this.$.env.is.exFrameExtBackground
  isForeground = !this.$.env.is.exFrameExtBackground
}
