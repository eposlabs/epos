export class Medium extends swVw.Unit {
  constructor(parent: swVw.Unit) {
    super(parent)

    if (this.$.env.is.vwPopup) {
      this.$.bus.on('Medium.isPopupOpen', () => true)
      this.$.bus.on('Medium.closePopup', () => self.close())
    } else if (this.$.env.is.vwSidePanel) {
      const tabId = Number(this.$.env.params.tabId)
      if (!tabId) throw this.never()
      this.$.bus.on(`Medium.isSidePanelOpen[${tabId}]`, () => true)
    }
  }

  // MARK: Tab
  // ===========================================================================

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

  // MARK: Popup
  // ===========================================================================

  async openPopup(tabId: number, windowId: number) {
    const path = this.$.env.url.view({ locus: 'popup', tabId, windowId })
    await this.$.browser.action.setPopup({ popup: path })
    await this.$.utils.safe(() => this.$.browser.action.openPopup())
    await this.$.browser.action.setPopup({ popup: '' })
  }

  async closePopup() {
    if (this.$.env.is.vwPopup) {
      self.close()
    } else {
      await this.$.bus.send('Medium.closePopup')
    }
  }

  // MARK: Side Panel
  // ===========================================================================

  async openSidePanel(tabId: number, windowId: number) {
    const path = this.$.env.url.view({ locus: 'sidePanel', tabId, windowId })
    // It is important to call this async, because `sidePanel.open` must be called on user gesture (action)
    void this.$.browser.sidePanel.setOptions({ tabId, path, enabled: true })
    await this.$.browser.sidePanel.open({ tabId })
  }

  async closeSidePanel(tabId: number) {
    await this.$.browser.sidePanel.setOptions({ tabId, enabled: false })
  }

  async toggleSidePanel(tabId: number, windowId: number) {
    const wasOpenPromise = this.$.bus.send(`Medium.isSidePanelOpen[${tabId}]`)
    await this.openSidePanel(tabId, windowId)
    const wasOpen = await wasOpenPromise
    if (wasOpen) await this.closeSidePanel(tabId)
  }
}
