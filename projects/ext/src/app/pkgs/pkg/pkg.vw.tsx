import type { Fragment } from './pkg.sw'

export class Pkg extends $vw.Unit {
  dev: Fragment['dev']
  name: Fragment['name']
  hash: Fragment['hash']
  popup: Fragment['popup']

  constructor(parent: $vw.Unit, fragment: Fragment) {
    super(parent)
    this.dev = fragment.dev
    this.name = fragment.name
    this.hash = fragment.hash
    this.popup = fragment.popup
  }

  update(fragment: Omit<Fragment, 'name'>) {
    this.dev = fragment.dev
    this.hash = fragment.hash
    this.popup = fragment.popup
  }

  ui = () => {
    const onClick = () => {
      this.$.shell.transaction(state => {
        state.selectedPkgName = this.name
      })
    }

    return (
      <div>
        <button onClick={onClick} className="bg-amber-200">
          CLICK [{this.$.shell.state.selectedPkgName}]
        </button>
        <iframe
          name={this.name}
          src={this.$.env.url.frame(this.name, this.dev)}
          className="m-40 h-[100vh] w-[100vw] border border-black"
        />
      </div>
    )
  }
}
