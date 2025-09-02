import type { PkgDeclaration } from './pkg/pkg.ex'

export class Pkgs extends $ex.Unit {
  map: { [name: string]: $ex.Pkg } = {}
  watcher = new $exOsVw.PkgsWatcher(this)

  create(decl: PkgDeclaration) {
    if (this.map[decl.name]) throw this.never
    const pkg = new $ex.Pkg(this, decl)
    this.map[decl.name] = pkg
    return pkg
  }
}
