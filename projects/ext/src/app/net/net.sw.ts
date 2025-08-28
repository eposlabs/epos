export class Net extends $sw.Unit {
  private ruleId = 0

  async init() {
    await this.cleanup()
    await this.disableCsp()
  }

  private async cleanup() {
    const rules = await this.$.browser.declarativeNetRequest.getSessionRules()
    if (rules.length === 0) return
    const removeRuleIds = rules.map(r => r.id)
    await this.$.browser.declarativeNetRequest.updateSessionRules({ removeRuleIds })
  }

  private async disableCsp() {
    await this.$.browser.declarativeNetRequest.updateSessionRules({
      addRules: [
        {
          id: ++this.ruleId,
          priority: 1,
          condition: {
            urlFilter: '*://*/*',
            resourceTypes: ['main_frame', 'xmlhttprequest'],
          },
          action: {
            type: 'modifyHeaders',
            responseHeaders: [
              { header: 'Content-Security-Policy', operation: 'remove' },
              { header: 'Content-Security-Policy-Report-Only', operation: 'remove' },
            ],
          },
        },
      ],
    })
  }
}
