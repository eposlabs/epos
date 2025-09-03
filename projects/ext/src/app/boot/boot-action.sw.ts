export class BootAction extends $sw.Unit {
  private $boot = this.up($sw.Boot)!

  constructor(parent: $sw.Unit) {
    super(parent)
    this.handleActionClick()
  }

  private handleActionClick() {
    this.$.browser.action.onClicked.addListener(async tab => {
      if (!tab.id) return

      // Has popup? -> Open popup
      if (this.$.pkgs.test('<popup>')) {
        await this.$boot.medium.openPopup(tab.id)
        return
      }

      // Has panel? -> Toggle panel
      if (this.$.pkgs.test('<panel>')) {
        await this.$boot.medium.togglePanel(tab.id)
        return
      }

      // Several actions? -> Open popup
      const actions = this.$.pkgs.getActions()
      const actionCount = Object.keys(actions).length
      if (actionCount > 1) {
        await this.$boot.medium.openPopup(tab.id)
        return
      }

      // Single action? -> Process that action
      if (actionCount === 1) {
        const name = Object.keys(actions)[0]
        const action = actions[name]
        if (action === true) {
          const bus = this.$.bus.create(`pkg[${name}]`)
          await bus.send('action')
        } else {
          await this.$boot.medium.openTab(action)
        }
      }
    })
  }
}
