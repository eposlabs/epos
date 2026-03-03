export type Rule = chrome.declarativeNetRequest.Rule
export type GetRulesFilter = chrome.declarativeNetRequest.GetRulesFilter
export type UpdateRuleOptions = chrome.declarativeNetRequest.UpdateRuleOptions

export class ProjectBrowserDeclarativeNetRequest extends sw.Unit {
  private $project = this.closest(sw.Project)!
  private queue = new this.$.utils.Queue()

  constructor(parent: sw.Unit) {
    super(parent)
    this.getDynamicRules = this.queue.wrap(this.getDynamicRules, this)
    this.getSessionRules = this.queue.wrap(this.getSessionRules, this)
    this.updateDynamicRules = this.queue.wrap(this.updateDynamicRules, this)
    this.updateSessionRules = this.queue.wrap(this.updateSessionRules, this)
    this.onProjectEnabled = this.queue.wrap(this.onProjectEnabled, this)
    this.onProjectDisabled = this.queue.wrap(this.onProjectDisabled, this)
    this.$project.onEnabled(this.onProjectEnabled)
    this.$project.onDisabled(this.onProjectDisabled)
  }

  async dispose() {
    const dynamicRuleIds = this.$project.meta.dynamicRules.map(rule => rule.id)
    const sessionRuleIds = this.$project.meta.sessionRules.map(rule => rule.id)
    await this.$.net.updateDynamicRules({ removeRuleIds: dynamicRuleIds })
    await this.$.net.updateSessionRules({ removeRuleIds: sessionRuleIds })
  }

  async getDynamicRules(filter?: GetRulesFilter) {
    const ruleIds = this.$project.meta.dynamicRules.map(rule => rule.id)
    const filterRuleIds = filter?.ruleIds ? filter.ruleIds.filter(id => ruleIds.includes(id)) : ruleIds
    return await this.$.browser.declarativeNetRequest.getDynamicRules({ ruleIds: filterRuleIds })
  }

  async getSessionRules(filter?: GetRulesFilter) {
    const ruleIds = this.$project.meta.sessionRules.map(rule => rule.id)
    const filterRuleIds = filter?.ruleIds ? filter.ruleIds.filter(id => ruleIds.includes(id)) : ruleIds
    return await this.$.browser.declarativeNetRequest.getSessionRules({ ruleIds: filterRuleIds })
  }

  async updateDynamicRules(options: UpdateRuleOptions) {
    const ruleIds = this.$project.meta.dynamicRules.map(rule => rule.id)
    const removeRuleIds = (options.removeRuleIds ?? []).filter(id => ruleIds.includes(id))
    const addRules = await this.$.net.updateDynamicRules({ ...options, removeRuleIds })
    const isNotRemoved = (rule: Rule) => !removeRuleIds.includes(rule.id)
    this.$project.meta.dynamicRules = this.$project.meta.dynamicRules.filter(isNotRemoved).concat(addRules)
    await this.$project.saveSnapshot()
    return addRules.map(rule => rule.id)
  }

  async updateSessionRules(options: UpdateRuleOptions) {
    const ruleIds = this.$project.meta.sessionRules.map(rule => rule.id)
    const removeRuleIds = (options.removeRuleIds ?? []).filter(id => ruleIds.includes(id))
    const addRules = await this.$.net.updateSessionRules({ ...options, removeRuleIds })
    const isNotRemoved = (rule: Rule) => !removeRuleIds.includes(rule.id)
    this.$project.meta.sessionRules = this.$project.meta.sessionRules.filter(isNotRemoved).concat(addRules)
    await this.$project.saveSnapshot()
    return addRules.map(rule => rule.id)
  }

  async onProjectEnabled() {
    const dynamicRules = this.$project.meta.dynamicRules
    const sessionRules = this.$project.meta.sessionRules
    this.$project.meta.dynamicRules = await this.$.net.updateDynamicRules({ addRules: dynamicRules })
    this.$project.meta.sessionRules = await this.$.net.updateSessionRules({ addRules: sessionRules })
    await this.$project.saveSnapshot()
  }

  async onProjectDisabled() {
    const dynamicRuleIds = this.$project.meta.dynamicRules.map(rule => rule.id)
    const sessionRuleIds = this.$project.meta.sessionRules.map(rule => rule.id)
    await this.$.net.updateDynamicRules({ removeRuleIds: dynamicRuleIds })
    await this.$.net.updateSessionRules({ removeRuleIds: sessionRuleIds })
  }
}
