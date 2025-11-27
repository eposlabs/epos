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
      if (this.dev) {
        console.log(
          `%c[${this.name}] %cRestart <background> %c${this.getTime()}`,
          'font-weight: bold',
          'font-weight: normal',
          'color: gray',
        )
      }
      this.frame.src = this.getFrameUrl()
    }
  }

  removeFrame() {
    if (this.dev) {
      console.log(
        `%c[${this.name}] %cStop <background> %c${this.getTime()}`,
        'font-weight: bold',
        'font-weight: normal',
        'color: gray',
      )
    }
    this.frame.remove()
  }

  private getTime() {
    return new Date().toString().split(' ')[4]
  }

  private createFrame() {
    if (this.dev) {
      console.log(
        `%c[${this.name}] %cStart <background> %c${this.getTime()} | Select "${this.name}" from the DevTools context dropdown to switch to it`,
        `font-weight: bold`,
        'font-weight: normal',
        `color: gray`,
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
      locus: 'background',
      name: this.name,
      hash: this.hash,
      dev: String(this.dev),
    })
  }
}
