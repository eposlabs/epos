import type { Fragment } from './pkg.sw'

export class Pkg extends $vw.Unit {
  dev: Fragment['dev']
  name: Fragment['name']
  hash: Fragment['hash']
  title: Fragment['title']
  popup: Fragment['popup']
  active = false

  constructor(parent: $vw.Unit, fragment: Fragment) {
    super(parent)
    this.dev = fragment.dev
    this.name = fragment.name
    this.hash = fragment.hash
    this.title = fragment.title
    this.popup = fragment.popup
  }

  update(fragment: Omit<Fragment, 'name'>) {
    this.dev = fragment.dev
    this.hash = fragment.hash
    this.title = fragment.title
    this.popup = fragment.popup
  }

  ui = () => {
    this.$.libs.preact.useContext(this.$.shell.context)
    const selected = this.$.pkgs.selectedPkgName === this.name
    if (!this.active) this.active = selected

    let width: number | string
    let height: number | string
    if (this.$.env.is.vwPopup) {
      width = this.popup?.width ?? 380
      height = this.popup?.height ?? 600
    } else if (this.$.env.is.vwPanel) {
      width = '100vw'
      height = '100vh'
    } else throw this.never

    let src = 'about:blank'
    if (this.active) {
      src = this.$.env.url.frame({ name: this.name, hash: this.hash, dev: this.dev })
    }

    return (
      <iframe
        name={this.name}
        src={src}
        style={{ width, height }}
        className={this.cx([!selected && 'hidden'])}
      />
    )
  }

  private cx(classNames: unknown[]) {
    return classNames.filter(this.$.is.string).join(' ')
  }
}
