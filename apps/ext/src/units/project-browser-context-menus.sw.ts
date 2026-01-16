export type Menu = Omit<CreateProperties, 'id'> & { id: string }
export type CreateProperties = chrome.contextMenus.CreateProperties
export type OnClickData = chrome.contextMenus.OnClickData

export class ProjectBrowserContextMenus extends sw.Unit {
  private $project = this.closest(sw.Project)!
  private $browser = this.closest(sw.ProjectBrowser)!
  private menus: Menu[] = []
  private queue = new this.$.utils.Queue()

  constructor(parent: sw.Unit) {
    super(parent)
    this.create = this.queue.wrap(this.create, this)
    this.remove = this.queue.wrap(this.remove, this)
    this.removeAll = this.queue.wrap(this.removeAll, this)
    this.update = this.queue.wrap(this.update, this)
    this.onProjectEnabled = this.queue.wrap(this.onProjectEnabled, this)
    this.onProjectDisabled = this.queue.wrap(this.onProjectDisabled, this)
    this.$project.onEnabled(this.onProjectEnabled)
    this.$project.onDisabled(this.onProjectDisabled)
  }

  async dispose() {
    await this.removeAll()
  }

  async create(props: CreateProperties) {
    const id = this.$browser.prefixed(props.id ?? this.$.utils.id())
    const existingMenu = this.menus.find(menu => menu.id === id)
    if (existingMenu) return this.$browser.unprefixed(existingMenu.id)

    const parentId = props.parentId ? this.$browser.prefixed(props.parentId) : undefined
    const menu = { ...props, id, parentId }
    this.$.browser.contextMenus.create(menu)
    this.menus.push(menu)
    return this.$browser.unprefixed(menu.id)
  }

  async remove(idArg: string | number) {
    const id = this.$browser.prefixed(idArg)
    this.menus = this.menus.filter(menu => menu.id !== id)
    await this.$.browser.contextMenus.remove(id)
  }

  async removeAll() {
    for (const menu of this.menus) await this.$.browser.contextMenus.remove(menu.id)
    this.menus = []
  }

  async update(idArg: string | number, updates: Omit<CreateProperties, 'id'>) {
    const id = this.$browser.prefixed(idArg)
    const menu = this.menus.find(menu => menu.id === id)
    if (!menu) return
    await this.$.browser.contextMenus.update(id, updates)
    Object.assign(menu, updates)
  }

  onClicked(data: OnClickData) {
    if (!this.$browser.isPrefixed(String(data.menuItemId))) return false
    data.menuItemId = this.$browser.unprefixed(String(data.menuItemId))
    if (data.parentMenuItemId) data.parentMenuItemId = this.$browser.unprefixed(String(data.parentMenuItemId))
  }

  private async onProjectEnabled() {
    for (const menu of this.menus) {
      this.$.browser.contextMenus.create(menu)
    }
  }

  private async onProjectDisabled() {
    for (const menu of this.menus) {
      await this.$.browser.contextMenus.remove(menu.id)
    }
  }
}
