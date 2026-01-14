import type { Entry } from './project.sw'

export class Project extends vw.Unit {
  private $projects = this.closest(vw.Projects)!
  id: Entry['id']
  mode: Entry['mode']
  spec: Entry['spec']
  hash: Entry['hash']
  hasSidePanel: Entry['hasSidePanel']
  private visited = false

  constructor(parent: vw.Unit, params: Entry) {
    super(parent)
    this.id = params.id
    this.mode = params.mode
    this.spec = params.spec
    this.hash = params.hash
    this.hasSidePanel = params.hasSidePanel
  }

  update(updates: Omit<Entry, 'id'>) {
    this.mode = updates.mode
    this.spec = updates.spec
    this.hash = updates.hash
    this.hasSidePanel = updates.hasSidePanel
  }

  async processAction() {
    if (!this.spec.action) return

    // Action is a URL? -> Open this URL
    if (this.$.utils.is.string(this.spec.action)) {
      const actionTab = (await this.$.browser.tabs.query({ url: this.spec.action }))[0]
      if (actionTab) {
        await this.$.browser.tabs.update(actionTab.id, { active: true })
      } else {
        await this.$.browser.tabs.create({ url: this.spec.action, active: true })
      }
      if (this.$.env.is.vwPopup) self.close()
    }

    // Action is `true`? -> Send `:action` event
    else {
      const tabId = this.$projects.getTabId()
      const tab = await this.$.browser.tabs.get(tabId)
      const projectEposBus = this.$.bus.use(`ProjectEpos[${this.id}]`)
      await projectEposBus.send(':action', tab)
      if (this.$.env.is.vwPopup) self.close()
    }
  }

  private getSrc() {
    if (!this.visited) return 'about:blank'
    return this.$.env.url.project({
      id: this.id,
      mode: this.mode,
      locus: this.getLocus(),
      tabId: this.$projects.getTabId(),
    })
  }

  private getLocus() {
    const locus = this.$.env.params.locus
    if (locus !== 'popup' && locus !== 'sidePanel') throw this.never()
    return locus
  }

  private getStyle() {
    if (this.$.env.is.vwPopup) {
      return { width: this.spec.popup.width, height: this.spec.popup.height }
    } else if (this.$.env.is.vwSidePanel) {
      return { width: '100%', height: '100%' }
    }
  }

  View = () => {
    if (!this.hash) return null
    const selected = this.$projects.selectedProjectId === this.id
    if (selected) this.visited = true
    return (
      <iframe
        key={this.hash}
        name={this.spec.slug}
        data-project-id={this.id}
        src={this.getSrc()}
        style={this.getStyle()}
        className={this.$.utils.cn(!selected && 'hidden')}
      />
    )
  }
}
