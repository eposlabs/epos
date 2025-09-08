export class Pkgs extends $os.Unit {
  map: { [name: string]: $os.Pkg } = {}
  watcher = new $exOsVw.PkgsWatcher(this)

  async init() {
    await this.initWatcher()
  }

  private async initWatcher() {
    await this.watcher.start((delta, data) => {
      // Update packages
      for (const meta of Object.values(data.execution)) {
        const pkg = this.map[meta.name]
        if (!pkg) continue
        pkg.update(meta)
      }

      // Add packages
      for (const name of delta.added) {
        const meta = data.execution[name]
        if (!meta) throw this.never
        this.map[name] = new $os.Pkg(this, meta)
      }

      // Remove packages
      for (const name of delta.removed) {
        const pkg = this.map[name]
        if (!pkg) throw this.never
        pkg.removeFrame()
        delete this.map[name]
      }
    })
  }
}
