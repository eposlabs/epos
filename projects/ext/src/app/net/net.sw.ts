export class Net extends $sw.Unit {
  private ruleId = 1

  static async create(parent: $sw.Unit) {
    const net = new Net(parent)
    await net.init()
    return net
  }

  private async init() {
    await this.cleanup()
    await this.disableCsp()
  }

  private async cleanup() {
    const rules = await this.$.browser.declarativeNetRequest.getSessionRules()
    if (rules.length === 0) return
    const removeRuleIds = rules.map(rule => rule.id)
    await this.$.browser.declarativeNetRequest.updateSessionRules({ removeRuleIds })
  }

  private async disableCsp() {
    await this.$.browser.declarativeNetRequest.updateSessionRules({
      addRules: [
        {
          id: this.ruleId++,
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

              // TODO: implement properly
              { header: 'x-frame-options', operation: 'remove' },
            ],
          },
        },
      ],
    })
  }
}
