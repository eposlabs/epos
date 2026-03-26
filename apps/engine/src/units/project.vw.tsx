import type { Entry } from './project.sw'

export class Project extends vw.Unit {
  private $projects = this.closest(vw.Projects)!
  id: Entry['id']
  debug: Entry['debug']
  spec: Entry['spec']
  hash: Entry['hash']
  hasSidePanel: Entry['hasSidePanel']
  private visited = false

  constructor(parent: vw.Unit, params: Entry) {
    super(parent)
    this.id = params.id
    this.debug = params.debug
    this.spec = params.spec
    this.hash = params.hash
    this.hasSidePanel = params.hasSidePanel
  }

  update(updates: Omit<Entry, 'id'>) {
    this.debug = updates.debug
    this.spec = updates.spec
    this.hash = updates.hash
    this.hasSidePanel = updates.hasSidePanel
  }

  async processAction() {
    if (!this.spec.action) return

    // Action is `true`? -> Send `:action` event
    if (this.spec.action === true) {
      const tab = await this.$.browser.tabs.get(this.$projects.tabInfo.tabId)
      const projectEposBus = this.$.bus.for(`ProjectEpos[${this.id}]`)
      await projectEposBus.send(':action', tab)
      if (this.$.env.is.vwPopup) self.close()
      return
    }

    // Action is `<page>`? -> Open project's page
    if (this.spec.action === '<page>') {
      const url = this.$.env.url.view({ id: this.id, locus: 'page' })
      const fullUrl = this.$.browser.runtime.getURL(url)
      await this.$.medium.openTab(fullUrl)
      if (this.$.env.is.vwPopup) self.close()
      return
    }

    // Action is a URL? -> Open this URL
    if (this.$.utils.is.string(this.spec.action)) {
      await this.$.medium.openTab(this.spec.action)
      if (this.$.env.is.vwPopup) self.close()
    }
  }

  private getSrc() {
    if (!this.visited) return 'about:blank'
    return this.$.env.url.project({
      id: this.id,
      locus: this.getLocus(),
      debug: this.debug,
      tabId: this.$projects.tabInfo.tabId,
      windowId: this.$projects.tabInfo.windowId,
    })
  }

  private getLocus() {
    const locus = this.$.env.extParams.locus
    if (locus !== 'page' && locus !== 'popup' && locus !== 'sidePanel') throw this.never()
    return locus
  }

  private getStyle() {
    if (this.$.env.is.vwPopup) {
      return {
        width: this.spec.popup.width,
        height: this.spec.popup.height,
      }
    }

    return {
      width: '100%',
      height: '100%',
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
