import type { Info } from './project.sw'

export class Project extends vw.Unit {
  private $projects = this.closest(vw.Projects)!
  id: Info['id']
  dev: Info['dev']
  spec: Info['spec']
  hash: Info['hash']
  hasSidePanel: Info['hasSidePanel']
  private visited = false

  constructor(parent: vw.Unit, info: Info) {
    super(parent)
    this.id = info.id
    this.dev = info.dev
    this.spec = info.spec
    this.hash = info.hash
    this.hasSidePanel = info.hasSidePanel
  }

  update(info: Omit<Info, 'id'>) {
    this.dev = info.dev
    this.spec = info.spec
    this.hash = info.hash
    this.hasSidePanel = info.hasSidePanel
  }

  get label() {
    return this.spec.title ?? this.spec.name
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
      dev: this.dev,
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

  // ---------------------------------------------------------------------------
  // VIEW
  // ---------------------------------------------------------------------------

  View = () => {
    if (!this.hash) return null
    const selected = this.$projects.selectedProjectId === this.id
    if (selected) this.visited = true
    return (
      <iframe
        key={this.hash}
        name={this.spec.name}
        data-project-id={this.id}
        src={this.getSrc()}
        style={this.getStyle()}
        className={this.$.utils.cn(!selected && 'hidden')}
      />
    )
  }
}
