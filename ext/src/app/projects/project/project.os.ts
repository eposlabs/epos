import type { ExecutionMeta } from './project.sw'

export class Project extends os.Unit {
  dev: ExecutionMeta['dev']
  name: ExecutionMeta['name']
  hash: ExecutionMeta['hash']
  frame: HTMLIFrameElement

  constructor(parent: os.Unit, data: Omit<ExecutionMeta, 'popup'>) {
    super(parent)
    this.dev = data.dev
    this.name = data.name
    this.hash = data.hash
    this.frame = this.createFrame()
  }

  update(data: Omit<ExecutionMeta, 'name' | 'popup'>) {
    this.dev = data.dev
    this.hash = data.hash
    if (this.hash !== data.hash) {
      this.frame.src = this.getFrameUrl()
    }
  }

  removeFrame() {
    this.frame.remove()
  }

  private createFrame() {
    const frame = document.createElement('iframe')
    frame.src = this.getFrameUrl()
    frame.name = this.name
    document.body.append(frame)
    return frame
  }

  private getFrameUrl() {
    return this.$.env.url.frame({
      type: 'background',
      name: this.name,
      hash: this.hash,
      dev: String(this.dev),
    })
  }
}
