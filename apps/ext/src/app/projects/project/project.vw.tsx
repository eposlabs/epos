import type { ExecutionMeta } from './project.sw'

export class Project extends vw.Unit {
  dev: ExecutionMeta['dev']
  name: ExecutionMeta['name']
  hash: ExecutionMeta['hash']
  title: ExecutionMeta['title']
  popup: ExecutionMeta['popup']
  invoked = false

  constructor(parent: vw.Unit, data: ExecutionMeta) {
    super(parent)
    this.dev = data.dev
    this.name = data.name
    this.hash = data.hash
    this.title = data.title
    this.popup = data.popup
  }

  update(data: Omit<ExecutionMeta, 'name'>) {
    this.dev = data.dev
    this.hash = data.hash
    this.title = data.title
    this.popup = data.popup
  }

  View = () => {
    const selected = this.$.projects.selectedProjectName === this.name
    if (!this.invoked) this.invoked = selected

    let width: number | string
    let height: number | string
    if (this.$.env.is.vwPopup) {
      width = this.popup?.width ?? 380
      height = this.popup?.height ?? 600
    } else if (this.$.env.is.vwSidePanel) {
      width = '100vw'
      height = '100vh'
    } else {
      throw this.never()
    }

    if (!this.invoked) return null

    const src = this.$.env.url.frame({
      locus: this.$.env.params.locus as 'popup' | 'sidePanel',
      tabId: this.$.env.params.tabId,
      name: this.name,
      hash: this.hash,
      dev: String(this.dev),
    })

    return (
      <iframe
        name={this.name}
        src={src}
        style={{ width, height }}
        className={this.$.utils.cx(!selected && 'hidden')}
      />
    )
  }
}
