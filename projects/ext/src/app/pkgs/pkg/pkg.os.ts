import type { InvokeShard } from './pkg.sw'

export class Pkg extends $os.Unit {
  dev: InvokeShard['dev']
  name: InvokeShard['name']
  hash: InvokeShard['hash']
  frame: HTMLIFrameElement

  constructor(parent: $os.Unit, data: Omit<InvokeShard, 'popup'>) {
    super(parent)
    this.dev = data.dev
    this.name = data.name
    this.hash = data.hash
    this.frame = this.createFrame()
  }

  update(data: Omit<InvokeShard, 'name' | 'popup'>) {
    this.dev = data.dev
    this.hash = data.hash
    this.frame.src = this.$.env.url.frame(this.name, this.hash, this.dev)
  }

  removeFrame() {
    this.frame.remove()
  }

  private createFrame() {
    const frame = document.createElement('iframe')
    frame.src = this.$.env.url.frame(this.name, this.hash, this.dev)
    frame.name = this.name
    document.body.append(frame)
    return frame
  }
}
