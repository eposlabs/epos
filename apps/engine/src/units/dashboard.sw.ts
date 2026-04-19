export class Dashboard extends sw.Unit {
  private url = 'https://app.epos.dev/'
  private urlFilter = 'https://app.epos.dev/*'

  isInstalled() {
    return this.$.projects.list.some(project => project.spec.slug === 'dashboard')
  }

  async reloadTabs() {
    const tabs = await this.$.browser.tabs.query({ url: this.urlFilter })
    for (const tab of tabs) {
      if (!tab.id) continue
      this.$.browser.tabs.reload(tab.id)
    }
  }

  async processAction() {
    if (!this.isInstalled()) return

    const dashboardTab = (await this.$.browser.tabs.query({ url: this.urlFilter }))[0]
    if (dashboardTab) {
      await this.$.browser.tabs.update(dashboardTab.id, { active: true })
    } else {
      await this.$.browser.tabs.create({ url: this.url, active: true })
    }
  }
}
