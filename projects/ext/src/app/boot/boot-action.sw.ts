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
      if (this.$.pkgs.matches('<popup>')) {
        await this.$boot.medium.openPopup(tab.id)
        return
      }

      // Has panel? -> Toggle panel
      if (this.$.pkgs.matches('<panel>')) {
        await this.$boot.medium.togglePanel(tab.id)
        return
      }

      // Has one action? -> Open tab with action url
      const actions = Object.values(this.$.pkgs.getActions())
      if (actions.length === 1) {
        await this.$boot.medium.openTab(actions[0])
        return
      }

      // Several actions? -> Open popup
      if (actions.length > 1) {
        await this.$boot.medium.openPopup(tab.id)
        return
      }
    })
  }
}
