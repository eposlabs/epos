import type { InvokeShard } from './pkg.sw'

export class Pkg extends $vw.Unit {
  dev: InvokeShard['dev']
  name: InvokeShard['name']
  hash: InvokeShard['hash']
  title: InvokeShard['title']
  popup: InvokeShard['popup']
  invoked = false

  constructor(parent: $vw.Unit, data: InvokeShard) {
    super(parent)
    this.dev = data.dev
    this.name = data.name
    this.hash = data.hash
    this.title = data.title
    this.popup = data.popup
  }

  update(data: Omit<InvokeShard, 'name'>) {
    this.dev = data.dev
    this.hash = data.hash
    this.title = data.title
    this.popup = data.popup
  }

  ui = () => {
    this.$.libs.preact.useContext(this.$.shell.context)
    const selected = this.$.pkgs.selectedPkgName === this.name
    if (!this.invoked) this.invoked = selected

    let width: number | string
    let height: number | string
    if (this.$.env.is.vwPopup) {
      width = this.popup?.width ?? 380
      height = this.popup?.height ?? 600
    } else if (this.$.env.is.vwPanel) {
      width = '100vw'
      height = '100vh'
    } else {
      throw this.never
    }

    let src = 'about:blank'
    if (this.invoked) src = this.$.env.url.frame({ name: this.name, hash: this.hash, dev: this.dev })

    return (
      <iframe
        name={this.name}
        src={src}
        style={{ width, height }}
        class={this.$.utils.cx([!selected && 'hidden'])}
      />
    )
  }
}
