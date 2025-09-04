import type { Popup } from '../pkgs-parser.sw'

export class Pkg extends $vw.Unit {
  name: string
  dev: boolean
  hash: string
  popup: Popup
  visited = false

  constructor(parent: $vw.Unit, opts: { name: string; hash: string; popup: Popup; dev: boolean }) {
    super(parent)
    this.name = opts.name
    this.dev = opts.dev
    this.hash = opts.hash
    this.popup = opts.popup
  }

  ui = () => {
    return (
      <iframe
        className="h-[100vh] w-[100vw]"
        src={this.$.env.url.frame(this.name, this.dev)}
        name={this.name}
      />
    )
  }
}
