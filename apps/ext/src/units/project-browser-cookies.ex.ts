import type { Cookies } from 'epos/browser'

export class ProjectBrowserCookies extends gl.Unit {
  private $browser = this.closest(ex.ProjectBrowser)!

  createApi(): { [K in keyof Cookies]-?: unknown } {
    return {
      // Methods
      get: this.$browser.createMethod('cookies.get'),
      getAll: this.$browser.createMethod('cookies.getAll'),
      getAllCookieStores: this.$browser.createMethod('cookies.getAllCookieStores'),
      getPartitionKey: this.$browser.createMethod('cookies.getPartitionKey'),
      remove: this.$browser.createMethod('cookies.remove'),
      set: this.$browser.createMethod('cookies.set'),

      // Events
      onChanged: this.$browser.createEvent('cookies.onChanged'),

      // Values
      OnChangedCause: this.$browser.getValue('cookies.OnChangedCause'),
      SameSiteStatus: this.$browser.getValue('cookies.SameSiteStatus'),
    }
  }
}
