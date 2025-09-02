import type { PkgDeclaration } from './pkg/pkg.ex'

export class Pkgs extends $ex.Unit {
  map: { [name: string]: $ex.Pkg } = {}
  watcher = new $exOsVw.PkgsWatcher(this)

  async init() {
    await this.initDevHubAutoReload()
  }

  create(decl: PkgDeclaration) {
    if (this.map[decl.name]) throw this.never
    const pkg = new $ex.Pkg(this, decl)
    this.map[decl.name] = pkg
    return pkg
  }

  private async initDevHubAutoReload() {
    if (!this.$.env.is.exTabHub) return
    await this.watcher.start(delta => {
      const names = Object.keys(this.map)
      const changed = delta.updated.some(name => names.includes(name))
      if (changed) location.reload()
    })
  }
}
