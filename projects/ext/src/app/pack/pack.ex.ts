import type { Props } from './pkg/pkg.ex'

export class Pack extends $ex.Unit {
  pkgs: { [name: string]: $ex.Pkg } = {}
  watcher = new $exOsVw.PackWatcher(this)

  async create(props: Props) {
    const pkg = await $ex.Pkg.create(this, props)
    this.pkgs[props.name] = pkg
    return pkg
  }
}
