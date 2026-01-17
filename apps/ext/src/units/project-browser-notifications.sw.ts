export type NotificationCreateOptions = chrome.notifications.NotificationCreateOptions
export type NotificationOptions = chrome.notifications.NotificationOptions
export type OnButtonClickedArgs = Parameters<Parameters<typeof chrome.notifications.onButtonClicked.addListener>[0]>
export type OnClickedArgs = Parameters<Parameters<typeof chrome.notifications.onClicked.addListener>[0]>
export type OnClosedArgs = Parameters<Parameters<typeof chrome.notifications.onClosed.addListener>[0]>

export class ProjectBrowserNotifications extends sw.Unit {
  private $project = this.closest(sw.Project)!
  private $browser = this.closest(sw.ProjectBrowser)!
  private queue = new this.$.utils.Queue()

  constructor(parent: sw.Unit) {
    super(parent)
    this.clear = this.queue.wrap(this.clear, this)
    this.create = this.queue.wrap(this.create, this)
    this.getAll = this.queue.wrap(this.getAll, this)
    this.update = this.queue.wrap(this.update, this)
    this.onProjectEnabled = this.queue.wrap(this.onProjectEnabled, this)
    this.onProjectDisabled = this.queue.wrap(this.onProjectDisabled, this)
    this.$project.onEnabled(this.onProjectEnabled)
    this.$project.onDisabled(this.onProjectDisabled)
  }

  async dispose() {
    await this.removeProjectNotifications()
  }

  async clear(idArg: string) {
    if (!this.$.utils.is.string(idArg)) throw new Error('Notification id required')
    const id = this.$browser.prefixed(idArg)
    return await this.$.browser.notifications.clear(id)
  }

  async create(options: NotificationCreateOptions): Promise<string>
  async create(id: string, options: NotificationCreateOptions): Promise<string>
  async create(...args: unknown[]) {
    const [id, options] = this.$.utils.is.string(args[0])
      ? [this.$browser.prefixed(args[0]), args[1] as NotificationCreateOptions]
      : [this.$browser.prefixed(this.$.utils.id()), args[0] as NotificationCreateOptions]

    // `chrome.notifications.create` does not throw, so we use callback syntax to catch errors
    return await new Promise((resolve, reject) => {
      this.$.browser.notifications.create(id, options, () => {
        if (this.$.browser.runtime.lastError) {
          reject(new Error(this.$.browser.runtime.lastError.message))
        } else {
          resolve(id)
        }
      })
    })
  }

  async getAll() {
    return await this.getProjectNotifications()
  }

  async update(idArg: string, options: NotificationOptions) {
    if (!this.$.utils.is.string(idArg)) throw new Error('Notification id required')
    const id = this.$browser.prefixed(idArg)
    return await this.$.browser.notifications.update(id, options)
  }

  onButtonClicked(id: string, buttonIndex: number) {
    if (!this.$browser.isPrefixed(id)) return
    return [this.$browser.unprefixed(id), buttonIndex]
  }

  onClicked(id: string) {
    if (!this.$browser.isPrefixed(id)) return
    return [this.$browser.unprefixed(id)]
  }

  onClosed(id: string, byUser: boolean) {
    if (!this.$browser.isPrefixed(id)) return
    return [this.$browser.unprefixed(id), byUser]
  }

  private async onProjectEnabled() {
    // No action needed
  }

  private async onProjectDisabled() {
    // No action needed
  }

  private async removeProjectNotifications() {
    const notifications = await this.getProjectNotifications()
    for (const id in notifications) await this.$.browser.notifications.clear(id)
  }

  private async getProjectNotifications() {
    const allNotifications = await this.$.browser.notifications.getAll()
    const projectNotifications: Record<string, true> = {}
    for (const id in allNotifications) {
      if (!this.$browser.isPrefixed(id)) continue
      projectNotifications[id] = true
    }

    return projectNotifications
  }
}
