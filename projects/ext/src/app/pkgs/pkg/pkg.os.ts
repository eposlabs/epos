export class Pkg extends $os.Unit {
  name: string
  hash: string
  dev: boolean
  frame: HTMLIFrameElement

  constructor(parent: $os.Unit, opts: { name: string; hash: string; dev: boolean }) {
    super(parent)
    this.name = opts.name
    this.hash = opts.hash
    this.dev = opts.dev
    this.frame = this.createFrame()
  }

  reloadFrame() {
    this.frame.src = this.$.env.url.frame(this.name, this.dev)
  }

  removeFrame() {
    this.frame.remove()
  }

  private createFrame() {
    const frame = document.createElement('iframe')
    frame.src = this.$.env.url.frame(this.name, this.dev)
    frame.name = this.name
    document.body.append(frame)
    return frame
  }
}
