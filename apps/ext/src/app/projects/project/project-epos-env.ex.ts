export class ProjectEposEnv extends ex.Unit {
  private $project = this.closest(ex.Project)!
  private $projects = this.closest(ex.Projects)!

  tabId = this.$projects.tabId
  project = this.$project.name
  isPopup = this.$.env.is.exExtension && this.$.env.params.locus === 'popup'
  isSidePanel = this.$.env.is.exExtension && this.$.env.params.locus === 'sidePanel'
  isBackground = this.$.env.is.exExtension && this.$.env.params.locus === 'background'
}
