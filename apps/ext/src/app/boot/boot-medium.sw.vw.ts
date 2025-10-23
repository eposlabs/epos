export class BootMedium extends swVw.Unit {
  constructor(parent: swVw.Unit) {
    super(parent)

    if (this.$.env.is.vwPopup) {
      this.$.bus.on('boot.isPopupOpen', () => true)
      this.$.bus.on('boot.closePopup', () => window.close())
    } else if (this.$.env.is.vwSidePanel) {
      const tabId = this.$.env.params.tabId
      this.$.bus.on(`boot.isSidePanelOpen[${tabId}]`, () => true)
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
  // SIDE PANEL
  // ---------------------------------------------------------------------------

  async openSidePanel(tabId: number) {
    const path = this.$.env.url.view({ type: 'sidePanel', tabId: String(tabId) })
    // It is important to call this async, because `sidePanel.open` must be called on user gesture (action)
    async: this.$.browser.sidePanel.setOptions({ tabId, path, enabled: true })
    await this.$.browser.sidePanel.open({ tabId })
  }

  async closeSidePanel(tabId: number) {
    await this.$.browser.sidePanel.setOptions({ tabId, enabled: false })
  }

  async toggleSidePanel(tabId: number) {
    const wasOpenPromise = this.$.bus.send(`boot.isSidePanelOpen[${tabId}]`)
    await this.openSidePanel(tabId)
    const wasOpen = await wasOpenPromise
    if (wasOpen) await this.closeSidePanel(tabId)
  }
}
