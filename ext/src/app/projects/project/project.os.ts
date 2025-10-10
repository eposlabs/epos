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
    const hashChanged = this.hash !== data.hash
    this.dev = data.dev
    this.hash = data.hash
    if (hashChanged) {
      if (this.dev) console.log(`%c[${this.name}]`, 'font-weight: bold', 'Restarting <background> process')
      this.frame.src = this.getFrameUrl()
    }
  }

  removeFrame() {
    if (this.dev) console.log(`%c[${this.name}]`, 'font-weight: bold', 'Stopping <background> process')
    this.frame.remove()
  }

  private createFrame() {
    if (this.dev) {
      console.log(`%c[${this.name}]`, 'font-weight: bold', 'Starting <background> process')
      console.log(
        '%cTo inspect it, select "lex" from the DevTools context dropdown',
        'font-style: italic; color: gray;',
      )
    }

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
