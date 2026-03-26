export class ProjectEposEnv extends ex.Unit {
  private $project = this.closest(ex.Project)!
  private $projects = this.closest(ex.Projects)!

  tabId = this.$projects.tabInfo.tabId
  windowId = this.$projects.tabInfo.windowId
  isPopup = this.$.env.is.exExtension && this.$.env.extParams.locus === 'popup'
  isSidePanel = this.$.env.is.exExtension && this.$.env.extParams.locus === 'sidePanel'
  isBackground = this.$.env.is.exExtension && this.$.env.extParams.locus === 'background'

  project = {
    id: this.$project.id,
    spec: this.$project.spec,
    manifest: this.$project.manifest,
    enabled: this.$project.enabled,
    debug: this.$project.debug,
    pageUrl: this.$.env.url.view({ locus: 'page', id: this.$project.id }),
  }
}
