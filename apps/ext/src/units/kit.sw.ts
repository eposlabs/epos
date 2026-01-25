export class Kit extends sw.Unit {
  private url = 'https://app.epos.dev/'
  private urlFilter = 'https://app.epos.dev/*'

  async reloadTabs() {
    const tabs = await this.$.browser.tabs.query({ url: this.urlFilter })
    for (const tab of tabs) {
      if (!tab.id) continue
      this.$.browser.tabs.reload(tab.id)
    }
  }

  async processAction() {
    const hasKitProject = this.$.projects.list.some(project => project.spec.slug === 'kit')
    if (!hasKitProject) return

    const kitTab = (await this.$.browser.tabs.query({ url: this.urlFilter }))[0]
    if (kitTab) {
      await this.$.browser.tabs.update(kitTab.id, { active: true })
    } else {
      await this.$.browser.tabs.create({ url: this.url, active: true })
    }
  }
}
