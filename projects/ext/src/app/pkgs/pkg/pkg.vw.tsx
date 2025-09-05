import type { Fragment } from './pkg.sw'

export class Pkg extends $vw.Unit {
  dev: Fragment['dev']
  name: Fragment['name']
  hash: Fragment['hash']
  title: Fragment['title']
  popup: Fragment['popup']

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
    this.popup = fragment.popup
  }

  ui = () => {
    const state = this.$.libs.preact.useContext(this.$.shell.context)
    const selected = state.selectedPkgName === this.name
    const active = state.activePkgNames.has(this.name)

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

    return (
      <iframe
        name={this.name}
        src={active ? this.$.env.url.frame(this.name, this.dev) : 'about:blank'}
        style={{ width, height }}
        className={this.cx([!selected && 'hidden'])}
      />
    )
  }

  private cx(classNames: unknown[]) {
    return classNames.filter(this.$.is.string).join(' ')
  }
}
