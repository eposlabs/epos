import type { PkgOpts } from './pkg/ex/pkg.ex'

export class Pkgs extends $ex.Unit {
  map: { [name: string]: $ex.Pkg } = {}
  watcher = new $exOsVw.PkgsWatcher(this)

  async init() {
    await this.initDevHubAutoReload()
  }

  create(opts: PkgOpts) {
    if (this.map[opts.name]) throw this.never
    const pkg = new $ex.Pkg(this, opts)
    this.map[opts.name] = pkg
    return pkg
  }

  private async initDevHubAutoReload() {
    if (!this.$.env.is.exTabHubDev) return
    await this.watcher.start(delta => {
      const names = Object.keys(this.map)
      const changed = delta.updated.some(name => names.includes(name))
      if (changed) location.reload()
    })
  }
}
