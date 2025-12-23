import type { Info } from './project.sw'

export class Project extends vw.Unit {
  private $projects = this.closest(vw.Projects)!
  name: Info['name']
  icon: Info['icon']
  title: Info['title']
  popup: Info['popup']
  action: Info['action']
  env: Info['env']
  hash: Info['hash']
  hasSidePanel: Info['hasSidePanel']
  private visited = false

  constructor(parent: vw.Unit, data: Info) {
    super(parent)
    this.name = data.name
    this.icon = data.icon
    this.title = data.title
    this.popup = data.popup
    this.action = data.action
    this.env = data.env
    this.hash = data.hash
    this.hasSidePanel = data.hasSidePanel
  }

  update(updates: Omit<Info, 'name'>) {
    this.icon = updates.icon
    this.title = updates.title
    this.popup = updates.popup
    this.action = updates.action
    this.env = updates.env
    this.hash = updates.hash
    this.hasSidePanel = updates.hasSidePanel
  }

  get label() {
    return this.title ?? this.name
  }

  async processAction() {
    if (!this.action) return

    // Action is a URL? -> Open this URL
    if (this.$.utils.is.string(this.action)) {
      const actionTab = (await this.$.browser.tabs.query({ url: this.action }))[0]
      if (actionTab) {
        await this.$.browser.tabs.update(actionTab.id, { active: true })
      } else {
        await this.$.browser.tabs.create({ url: this.action, active: true })
      }
      if (this.$.env.is.vwPopup) self.close()
    }

    // Action is `true`? -> Send `:action` event
    else {
      const tabId = this.$projects.getTabId()
      const tab = await this.$.browser.tabs.get(tabId)
      const projectEposBus = this.$.bus.create(`ProjectEpos[${this.name}]`)
      await projectEposBus.send(':action', tab)
      if (this.$.env.is.vwPopup) self.close()
    }
  }

  private getSrc() {
    if (!this.visited) return 'about:blank'
    return this.$.env.url.project({
      name: this.name,
      locus: this.getLocus(),
      tabId: this.$projects.getTabId(),
      env: this.env,
    })
  }

  private getLocus() {
    const locus = this.$.env.params.locus
    if (locus !== 'popup' && locus !== 'sidePanel') throw this.never()
    return locus
  }

  private getStyle() {
    if (this.$.env.is.vwPopup) {
      return { width: this.popup.width, height: this.popup.height }
    } else if (this.$.env.is.vwSidePanel) {
      return { width: '100%', height: '100%' }
    }
  }

  // ---------------------------------------------------------------------------
  // VIEW
  // ---------------------------------------------------------------------------

  View = () => {
    if (!this.hash) return null
    const selected = this.$projects.selectedProjectName === this.name
    if (selected) this.visited = true
    return (
      <iframe
        key={this.hash}
        name={this.name}
        src={this.getSrc()}
        style={this.getStyle()}
        className={this.$.utils.cn(!selected && 'hidden')}
      />
    )
  }
}
