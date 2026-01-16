import type { Action } from 'epos/browser'

export class ProjectBrowserAction extends gl.Unit {
  private $browser = this.closest(ex.ProjectBrowser)!

  createApi(): { [K in keyof Action]-?: unknown } {
    return {
      // Methods
      disable: this.$browser.createMethod('action.disable'),
      enable: this.$browser.createMethod('action.enable'),
      getBadgeBackgroundColor: this.$browser.createMethod('action.getBadgeBackgroundColor'),
      getBadgeText: this.$browser.createMethod('action.getBadgeText'),
      getBadgeTextColor: this.$browser.createMethod('action.getBadgeTextColor'),
      getPopup: this.$browser.createMethod('action.getPopup'),
      getTitle: this.$browser.createMethod('action.getTitle'),
      getUserSettings: this.$browser.createMethod('action.getUserSettings'),
      isEnabled: this.$browser.createMethod('action.isEnabled'),
      setBadgeBackgroundColor: this.$browser.createMethod('action.setBadgeBackgroundColor'),
      setBadgeText: this.$browser.createMethod('action.setBadgeText'),
      setBadgeTextColor: this.$browser.createMethod('action.setBadgeTextColor'),
      setIcon: this.$browser.createMethod('action.setIcon'),
      setPopup: this.$browser.createMethod('action.setPopup'),
      setTitle: this.$browser.createMethod('action.setTitle'),

      // Events
      onClicked: this.$browser.createEvent('action.onClicked'),
      onUserSettingsChanged: this.$browser.createEvent('action.onUserSettingsChanged'),
    }
  }
}
