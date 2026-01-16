export type AlarmCreateInfo = chrome.alarms.AlarmCreateInfo

export class ProjectBrowserAlarms extends sw.Unit {
  private $project = this.closest(sw.Project)!
  private $browser = this.closest(sw.ProjectBrowser)!
  private queue = new this.$.utils.Queue()

  constructor(parent: sw.Unit) {
    super(parent)
    this.clear = this.queue.wrap(this.clear, this)
    this.clearAll = this.queue.wrap(this.clearAll, this)
    this.create = this.queue.wrap(this.create, this)
    this.get = this.queue.wrap(this.get, this)
    this.getAll = this.queue.wrap(this.getAll, this)
    this.onProjectEnabled = this.queue.wrap(this.onProjectEnabled, this)
    this.onProjectDisabled = this.queue.wrap(this.onProjectDisabled, this)
    this.$project.onEnabled(this.onProjectEnabled)
    this.$project.onDisabled(this.onProjectDisabled)
  }

  async init() {
    if (!this.$project.enabled) return
    await this.onProjectEnabled()
  }

  async dispose() {
    await this.clearAll()
  }

  async clear(nameArg = '') {
    const name = this.$browser.prefixed(nameArg)
    await this.$.browser.alarms.clear(name)
    await this.updateProjectAlarms()
  }

  async clearAll() {
    for (const alarm of this.$project.meta.alarms) await this.$.browser.alarms.clear(alarm.name)
    await this.updateProjectAlarms()
  }

  async create(info: AlarmCreateInfo): Promise<void>
  async create(name: string, info: AlarmCreateInfo): Promise<void>
  async create(...args: unknown[]): Promise<void> {
    const [name, info] = this.$.utils.is.string(args[0])
      ? [this.$browser.prefixed(args[0]), args[1] as AlarmCreateInfo]
      : [this.$browser.prefixed(''), args[0] as AlarmCreateInfo]

    await this.$.browser.alarms.create(name, info)
    await this.updateProjectAlarms()
  }

  async get(nameArg = '') {
    const name = this.$browser.prefixed(nameArg)
    return await this.$.browser.alarms.get(name)
  }

  async getAll() {
    const alarms = await this.$.browser.alarms.getAll()
    return alarms
      .filter(alarm => this.$browser.isPrefixed(alarm.name))
      .map(alarm => ({ ...alarm, name: this.$browser.unprefixed(alarm.name) }))
  }

  onAlarm(alarm: chrome.alarms.Alarm) {
    if (!this.$browser.isPrefixed(alarm.name)) return false
    alarm.name = this.$browser.unprefixed(alarm.name)
  }

  private async onProjectEnabled() {
    for (const alarm of this.$project.meta.alarms) {
      await this.$.browser.alarms.create(alarm.name, {
        when: alarm.scheduledTime,
        periodInMinutes: alarm.periodInMinutes,
      })
    }
  }

  private async onProjectDisabled() {
    for (const alarm of this.$project.meta.alarms) {
      await this.$.browser.alarms.clear(alarm.name)
    }
  }

  private async updateProjectAlarms() {
    const allAlarms = await this.$.browser.alarms.getAll()
    const projectAlarms = allAlarms.filter(alarm => this.$browser.isPrefixed(alarm.name))
    await this.$project.updateMeta({ alarms: projectAlarms })
  }
}
