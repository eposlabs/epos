export class ProjectEposEnv extends ex.Unit {
  private $project = this.closest(ex.Project)!
  private $projects = this.closest(ex.Projects)!

  tabId = this.$projects.env.tabId
  windowId = this.$projects.env.windowId
  isPopup = this.$.env.is.exExtension && this.$.env.params.locus === 'popup'
  isSidePanel = this.$.env.is.exExtension && this.$.env.params.locus === 'sidePanel'
  isBackground = this.$.env.is.exExtension && this.$.env.params.locus === 'background'

  project = {
    id: this.$project.id,
    debug: this.$project.debug,
    enabled: this.$project.enabled,
    spec: this.$project.spec,
    manifest: this.$project.manifest,
  }
}
