import type { Props } from './pkg/pkg.ex'

export class Pkgs extends $ex.Unit {
  map: { [name: string]: $ex.Pkg } = {}
  watcher = new $exOsVw.PkgsWatcher(this)

  async create(props: Props) {
    const pkg = await $ex.Pkg.create(this, props)
    this.map[props.name] = pkg
    return pkg
  }

  constructor(parent: $ex.Unit) {
    super(parent)

    this.watcher.start(delta => {
      if (delta.updated.length > 0 && new URLSearchParams(location.search).has('autoreload')) {
        location.reload()
      }
    })
  }
}
