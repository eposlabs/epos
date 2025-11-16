export type Rule = Omit<chrome.declarativeNetRequest.Rule, 'id'>

export class Net extends sw.Unit {
  private nextRuleId = 1

  static async init(parent: sw.Unit) {
    const i = new this(parent)
    await i.init()
    return i
  }

  private async init() {
    this.$.bus.on('net.addSessionRule', this.addSessionRule, this)
    this.$.bus.on('net.removeSessionRule', this.removeSessionRule, this)
    await this.removeAllSessionRules()
    await this.disableCsp()
  }

  async addSessionRule(rule: Rule) {
    const id = this.nextRuleId
    this.nextRuleId += 1
    await this.$.browser.declarativeNetRequest.updateSessionRules({ addRules: [{ ...rule, id }] })
    return id
  }

  async removeSessionRule(id: number) {
    await this.$.browser.declarativeNetRequest.updateSessionRules({ removeRuleIds: [id] })
  }

  private async removeAllSessionRules() {
    const sessionRules = await this.$.browser.declarativeNetRequest.getSessionRules()
    if (sessionRules.length === 0) return
    const sessionRuleIds = sessionRules.map(rule => rule.id)
    await this.$.browser.declarativeNetRequest.updateSessionRules({ removeRuleIds: sessionRuleIds })
  }

  private async disableCsp() {
    await this.addSessionRule({
      priority: 1,
      condition: {
        urlFilter: '*://*/*',
        resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest'],
      },
      action: {
        type: 'modifyHeaders',
        responseHeaders: [
          { header: 'Content-Security-Policy', operation: 'remove' },
          { header: 'Content-Security-Policy-Report-Only', operation: 'remove' },

          // TODO
          { header: 'x-frame-options', operation: 'remove' },
        ],
      },
    })
  }
}
