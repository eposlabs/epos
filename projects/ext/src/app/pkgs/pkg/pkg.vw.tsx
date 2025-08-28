import type { Popup } from 'epos-types'

export class Pkg extends $vw.Unit {
  name: string
  hash: string
  popup: Popup
  visited = false

  constructor(parent: $vw.Unit, opts: { name: string; hash: string; popup: Popup }) {
    super(parent)
    this.name = opts.name
    this.hash = opts.hash
    this.popup = opts.popup
  }

  ui = () => {
    return (
      <iframe
        className="h-[100vh] w-[100vw]"
        src={this.$.env.url.frame(this.name)}
        name={this.name}
      />
    )
  }
}
