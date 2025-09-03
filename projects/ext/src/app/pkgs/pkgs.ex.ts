import type { Props } from './pkg/pkg.ex'

export class Pkgs extends $ex.Unit {
  map: { [name: string]: $ex.Pkg } = {}
  watcher = new $exOsVw.PkgsWatcher(this)

  create(props: Props) {
    if (this.map[props.name]) throw this.never
    const pkg = new $ex.Pkg(this, props)
    this.map[props.name] = pkg
    return pkg
  }
}
