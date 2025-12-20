import type { Info } from './project.sw'

export const DEFAULT_POPUP_WIDTH = 380
export const DEFAULT_POPUP_HEIGHT = 568

export class Project extends vw.Unit {
  static DEFAULT_POPUP_WIDTH = DEFAULT_POPUP_WIDTH
  static DEFAULT_POPUP_HEIGHT = DEFAULT_POPUP_HEIGHT
  private $projects = this.closest(vw.Projects)!
  name: Info['name']
  icon: Info['icon']
  title: Info['title']
  popup: Info['popup']
  action: Info['action']
  env: Info['env']
  hash: Info['hash']
  hasSidePanel: Info['hasSidePanel']

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

  View = () => {
    if (!this.hash) return null
    const selected = this.$projects.selectedProjectName === this.name
    return (
      <iframe
        key={this.hash}
        name={this.name}
        src={this.getSrc()}
        style={this.getStyle()}
        className={this.$.utils.cx(!selected && 'hidden')}
      />
    )
  }

  OptionView = () => {
    if (!this.hash && !this.action) return null
    return (
      <option key={this.name} value={this.name}>
        {this.title ?? this.name} {!this.hash && ' (action)'}
      </option>
    )
  }

  ButtonView = () => {
    if (!this.hash && !this.action) return null
    const icon = this.hash ? '🔵' : '🟠'

    const onClick = async () => {
      if (this.hash) {
        alert('popup')
      } else if (this.action) {
        if (this.$.utils.is.string(this.action)) {
          const tabs = await this.$.browser.tabs.query({ url: this.action })
          if (tabs.length > 0) {
            await this.$.browser.tabs.update(tabs[0].id, { active: true })
          } else {
            await this.$.browser.tabs.create({ url: this.action, active: true })
          }
        } else {
          const tabId = this.getTabId()
          const tab = await this.$.browser.tabs.get(tabId)
          const projectEposBus = this.$.bus.create(`ProjectEpos[${this.name}]`)
          await projectEposBus.send(':action', tab)
          self.close()
        }
      }
    }

    return (
      <div onClick={onClick}>
        {icon} {this.name}
      </div>
    )
  }

  private getSrc() {
    return this.$.env.url.project({
      name: this.name,
      locus: this.getLocus(),
      tabId: this.getTabId(),
      env: this.env,
    })
  }

  private getLocus() {
    const locus = this.$.env.params.locus
    if (locus !== 'popup' && locus !== 'sidePanel') throw this.never()
    return locus
  }

  private getTabId() {
    const tabId = Number(this.$.env.params.tabId)
    if (!tabId) throw this.never()
    return tabId
  }

  private getStyle() {
    let width: number | string
    let height: number | string
    if (this.$.env.is.vwPopup) {
      width = this.popup?.width ?? DEFAULT_POPUP_WIDTH
      height = this.popup?.height ?? DEFAULT_POPUP_HEIGHT
    } else if (this.$.env.is.vwSidePanel) {
      width = '100vw'
      height = '100vh'
    } else {
      throw this.never()
    }

    console.warn(width, height)

    return { width, height }
  }
}
