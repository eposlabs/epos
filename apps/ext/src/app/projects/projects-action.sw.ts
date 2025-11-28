export class ProjectsAction extends sw.Unit {
  constructor(parent: sw.Unit) {
    super(parent)
    this.handleActionClick()
  }

  private handleActionClick() {
    this.$.browser.action.onClicked.addListener(async tab => {
      if (!tab.id) return

      // Has popup? -> Open popup
      if (this.$.projects.hasPopup()) {
        await this.$.tools.medium.openPopup(tab.id)
        return
      }

      // Has side panel? -> Toggle side panel
      if (this.$.projects.hasSidePanel()) {
        await this.$.tools.medium.toggleSidePanel(tab.id)
        return
      }

      // Several actions? -> Open popup
      const actionData = this.$.projects.getActionData()
      const actionCount = Object.keys(actionData).length
      if (actionCount > 1) {
        await this.$.tools.medium.openPopup(tab.id)
        return
      }

      // Single action? -> Process that action
      if (actionCount === 1) {
        const name = Object.keys(actionData)[0]
        const action = actionData[name].action
        if (action === true) {
          const projectBus = this.$.bus.create(`project[${name}]`)
          await projectBus.send(':action', tab.id)
        } else {
          await this.$.tools.medium.openTab(action)
        }
      }
    })
  }
}
