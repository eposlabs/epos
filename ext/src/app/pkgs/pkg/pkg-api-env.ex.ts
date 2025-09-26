export class PkgApiEnv extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!
  tabId = this.$pkg.tabId
  isTab = this.$.env.is.exTab
  isShell = this.$.env.is.exFrameExtPopup || this.$.env.is.exFrameExtSidePanel
  isPopup = this.$.env.is.exFrameExtPopup
  isSidePanel = this.$.env.is.exFrameExtSidePanel
  isFrame = this.$.env.is.exFrameWeb
  isBackground = this.$.env.is.exFrameExtBackground
  isForeground = !this.$.env.is.exFrameExtBackground && !this.$.env.is.exFrameWeb
}
