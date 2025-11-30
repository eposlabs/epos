export class ProjectsAction extends sw.Unit {
  private $projects = this.closest(sw.Projects)!

  constructor(parent: sw.Unit) {
    super(parent)
    this.$.browser.action.onClicked.addListener(this.onActionClick)
  }

  private onActionClick = async (tab: chrome.tabs.Tab) => {
    if (!tab.id) return

    // Has popup? -> Open popup
    if (this.$projects.hasPopup()) {
      await this.$.tools.medium.openPopup(tab.id)
      return
    }

    // Has side panel? -> Toggle side panel
    if (this.$projects.hasSidePanel()) {
      await this.$.tools.medium.toggleSidePanel(tab.id)
      return
    }

    // Several actions? -> Open popup
    const actionData = this.$projects.getActionData()
    const actionCount = Object.keys(actionData).length
    if (actionCount > 1) {
      await this.$.tools.medium.openPopup(tab.id)
      return
    }

    // Single action? -> Process that action
    if (actionCount === 1) {
      const projectName = Object.keys(actionData)[0]
      const action = actionData[projectName].action
      if (action === true) {
        const projectBus = this.$.bus.create(`Project[${projectName}]`)
        await projectBus.send(':action', tab.id)
      } else {
        await this.$.tools.medium.openTab(action)
      }
    }
  }
}
