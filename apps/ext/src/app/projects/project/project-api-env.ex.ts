export class ProjectApiEnv extends ex.Unit {
  private $project = this.closest(ex.Project)!
  name = this.$project.name
  tabId = this.$project.tabId
  isWeb = this.$.env.is.exFrameWeb
  isPopup = this.$.env.is.exFramePopup
  isSidePanel = this.$.env.is.exFrameSidePanel
  isBackground = this.$.env.is.exFrameBackground
}
