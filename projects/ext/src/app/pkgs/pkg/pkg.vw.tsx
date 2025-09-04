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

    return (
      <div>
        <iframe
          name={this.name}
          src={active ? this.$.env.url.frame(this.name, this.dev) : 'about:blank'}
          className={this.cx([
            '_h-[100vh] _w-[100vw] m-40 h-[600px] w-[600px] border border-black',
            !selected && 'hidden',
          ])}
        />
      </div>
    )
  }

  cx(classNames: unknown[]) {
    return classNames.filter(this.$.is.string).join(' ')
  }
}
