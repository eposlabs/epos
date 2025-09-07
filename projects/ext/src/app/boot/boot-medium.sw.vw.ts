export class BootMedium extends $swVw.Unit {
  constructor(parent: $swVw.Unit) {
    super(parent)

    if (this.$.env.is.vwPopup) {
      this.$.bus.on('boot.isPopupOpen', () => true)
      this.$.bus.on('boot.closePopup', () => window.close())
    } else if (this.$.env.is.vwPanel) {
      const tabId = this.$.env.params.tabId
      this.$.bus.on(`boot.isPanelOpen[${tabId}]`, () => true)
    }
  }

  // ---------------------------------------------------------------------------
  // TAB
  // ---------------------------------------------------------------------------

  async openTab(url: string) {
    // Make sure url ends with '/' when no path is provided,
    // otherwise tabs.query fails (https://x.com fails, https://x.com/ works)
    url = this.$.utils.normalizeUrl(url)

    const tab = (await this.$.browser.tabs.query({ url }))[0]
    if (tab && tab.id) {
      await this.$.browser.tabs.update(tab.id, { active: true })
    } else {
      await this.$.browser.tabs.create({ url, active: true })
    }
  }

  // ---------------------------------------------------------------------------
  // POPUP
  // ---------------------------------------------------------------------------

  async openPopup(tabId: number) {
    const path = this.$.env.url.view({ type: 'popup', tabId: String(tabId) })
    await this.$.browser.action.setPopup({ popup: path })
    await this.$.utils.safe(() => this.$.browser.action.openPopup())
    await this.$.browser.action.setPopup({ popup: '' })
  }

  async closePopup() {
    if (this.$.env.is.vwPopup) {
      window.close()
    } else {
      await this.$.bus.send('boot.closePopup')
    }
  }

  async togglePopup(tabId: number) {
    const open = await this.$.bus.send('boot.isPopupOpen')
    if (open) {
      await this.closePopup()
    } else {
      await this.openPopup(tabId)
    }
  }

  // ---------------------------------------------------------------------------
  // PANEL
  // ---------------------------------------------------------------------------

  async openPanel(tabId: number) {
    const path = this.$.env.url.view({ type: 'panel', tabId: String(tabId) })
    await this.$.browser.sidePanel.setOptions({ tabId, path, enabled: true })
    await this.$.browser.sidePanel.open({ tabId })
  }

  async closePanel(tabId: number) {
    await this.$.browser.sidePanel.setOptions({ tabId, enabled: false })
  }

  async togglePanel(tabId: number) {
    const wasOpenPromise = this.$.bus.send(`boot.isPanelOpen[${tabId}]`)
    await this.openPanel(tabId)
    const wasOpen = await wasOpenPromise
    if (wasOpen) await this.closePanel(tabId)
  }
}
