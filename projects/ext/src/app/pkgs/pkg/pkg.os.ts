export class Pkg extends $os.Unit {
  name: string
  hash: string
  frame: HTMLIFrameElement

  constructor(parent: $os.Unit, opts: { name: string; hash: string }) {
    super(parent)
    this.name = opts.name
    this.hash = opts.hash
    this.frame = this.createFrame()
  }

  reloadFrame() {
    this.frame.src = this.$.env.url.frame(this.name)
  }

  removeFrame() {
    this.frame.remove()
  }

  private createFrame() {
    const frame = document.createElement('iframe')
    frame.src = this.$.env.url.frame(this.name)
    frame.name = this.name
    document.body.append(frame)
    return frame
  }
}
