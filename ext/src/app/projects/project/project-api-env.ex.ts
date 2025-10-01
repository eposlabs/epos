export class ProjectApiEnv extends $ex.Unit {
  private $project = this.up($ex.Project)!
  tabId = this.$project.tabId
  isWeb = this.$.env.is.exFrameWeb
  isPopup = this.$.env.is.exFramePopup
  isSidePanel = this.$.env.is.exFrameSidePanel
  isBackground = this.$.env.is.exFrameBackground
}
