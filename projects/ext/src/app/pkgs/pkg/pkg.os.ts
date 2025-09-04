import type { Fragment } from './pkg.sw'

export class Pkg extends $os.Unit {
  dev: Fragment['dev']
  name: Fragment['name']
  hash: Fragment['hash']
  frame: HTMLIFrameElement

  constructor(parent: $os.Unit, fragment: Omit<Fragment, 'popup'>) {
    super(parent)
    this.dev = fragment.dev
    this.name = fragment.name
    this.hash = fragment.hash
    this.frame = this.createFrame()
  }

  update(fragment: Omit<Fragment, 'name' | 'popup'>) {
    this.dev = fragment.dev
    this.hash = fragment.hash
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
