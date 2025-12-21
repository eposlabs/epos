export type Rule = Omit<chrome.declarativeNetRequest.Rule, 'id'>

export class Net extends sw.Unit {
  private cursorRuleId = 1
  private freeRuleIds = new Set<number>()

  async init() {
    this.$.bus.on('Net.addRule', this.addRule, this)
    this.$.bus.on('Net.removeRule', this.removeRule, this)
    await this.removeAllRules()
  }

  async addRule(rule: Rule) {
    const id = this.getNextRuleId()
    await this.$.browser.declarativeNetRequest.updateSessionRules({ addRules: [{ ...rule, id }] })
    return id
  }

  async removeRule(id: number) {
    await this.$.browser.declarativeNetRequest.updateSessionRules({ removeRuleIds: [id] })
    this.freeRuleIds.add(id)
  }

  async getRules() {
    return await this.$.browser.declarativeNetRequest.getSessionRules()
  }

  private async removeAllRules() {
    const sessionRules = await this.$.browser.declarativeNetRequest.getSessionRules()
    if (sessionRules.length === 0) return
    const sessionRuleIds = sessionRules.map(rule => rule.id)
    await this.$.browser.declarativeNetRequest.updateSessionRules({ removeRuleIds: sessionRuleIds })
  }

  private getNextRuleId() {
    if (this.freeRuleIds.size === 0) {
      const id = this.cursorRuleId
      this.cursorRuleId += 1
      return id
    } else {
      const id = [...this.freeRuleIds][0]
      if (this.$.utils.is.undefined(id)) throw this.never()
      this.freeRuleIds.delete(id)
      return id
    }
  }
}
