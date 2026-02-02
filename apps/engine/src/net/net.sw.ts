export type Rule = chrome.declarativeNetRequest.Rule
export type RuleNoId = Omit<Rule, 'id'>
export type UpdateRuleOptions = { addRules?: RuleNoId[]; removeRuleIds?: number[] }

export class Net extends sw.Unit {
  MAX_PRIORITY = 2_147_483_647
  private MIN_DYNAMIC_RULE_ID = 2 // 1 is reserved for CSP
  private MIN_SESSION_RULE_ID = 1
  private dynamicRuleIdCursor = this.MIN_DYNAMIC_RULE_ID
  private sessionRuleIdCursor = this.MIN_SESSION_RULE_ID
  private freeDynamicRuleIds = new Set<number>()
  private freeSessionRuleIds = new Set<number>()

  async init() {
    await this.disableCsp()
    await this.populateDynamicIdPool()
    await this.populateSessionIdPool()
    this.updateDynamicRules = this.$.utils.enqueue(this.updateDynamicRules, this)
    this.updateSessionRules = this.$.utils.enqueue(this.updateSessionRules, this)
  }

  async disableCsp() {
    await this.$.browser.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1],
      addRules: [
        {
          id: 1,
          priority: this.MAX_PRIORITY,
          condition: {
            urlFilter: '*://*/*',
            resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest'],
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

  async updateDynamicRules(options: UpdateRuleOptions): Promise<Rule[]> {
    const addRules = (options.addRules ?? []).map(rule => ({ ...rule, id: this.nextDynamicRuleId() }))
    const removeRuleIds = (options.removeRuleIds ?? []).filter(id => id < this.dynamicRuleIdCursor)
    await this.$.browser.declarativeNetRequest.updateDynamicRules({ ...options, addRules })
    removeRuleIds.forEach(id => this.freeDynamicRuleIds.add(id))
    return addRules
  }

  async updateSessionRules(options: UpdateRuleOptions): Promise<Rule[]> {
    const addRules = (options.addRules ?? []).map(rule => ({ ...rule, id: this.nextSessionRuleId() }))
    const removeRuleIds = (options.removeRuleIds ?? []).filter(id => id < this.sessionRuleIdCursor)
    await this.$.browser.declarativeNetRequest.updateSessionRules({ ...options, addRules })
    removeRuleIds.forEach(id => this.freeSessionRuleIds.add(id))
    return addRules
  }

  private async populateDynamicIdPool() {
    const rules = await this.$.browser.declarativeNetRequest.getDynamicRules()
    const ruleIds = rules.map(rule => rule.id).sort((a, b) => a - b)
    if (ruleIds.length === 0) return

    const maxRuleId = ruleIds.at(-1)
    if (!maxRuleId) throw this.never()

    for (let i = this.MIN_DYNAMIC_RULE_ID; i < maxRuleId; i++) {
      if (ruleIds.includes(i)) continue
      this.freeDynamicRuleIds.add(i)
    }

    this.dynamicRuleIdCursor = maxRuleId + 1
  }

  private async populateSessionIdPool() {
    const rules = await this.$.browser.declarativeNetRequest.getSessionRules()
    const ruleIds = rules.map(rule => rule.id).sort((a, b) => a - b)
    if (ruleIds.length === 0) return

    const maxRuleId = ruleIds.at(-1)
    if (!maxRuleId) throw this.never()

    for (let i = this.MIN_SESSION_RULE_ID; i < maxRuleId; i++) {
      if (ruleIds.includes(i)) continue
      this.freeSessionRuleIds.add(i)
    }

    this.sessionRuleIdCursor = maxRuleId + 1
  }

  private nextDynamicRuleId() {
    if (this.freeDynamicRuleIds.size === 0) {
      const id = this.dynamicRuleIdCursor
      this.dynamicRuleIdCursor += 1
      return id
    } else {
      const id = [...this.freeDynamicRuleIds][0]
      if (this.$.utils.is.undefined(id)) throw this.never()
      this.freeDynamicRuleIds.delete(id)
      return id
    }
  }

  private nextSessionRuleId() {
    if (this.freeSessionRuleIds.size === 0) {
      const id = this.sessionRuleIdCursor
      this.sessionRuleIdCursor += 1
      return id
    } else {
      const id = [...this.freeSessionRuleIds][0]
      if (this.$.utils.is.undefined(id)) throw this.never()
      this.freeSessionRuleIds.delete(id)
      return id
    }
  }
}
