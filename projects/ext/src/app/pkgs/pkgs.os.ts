export class Pkgs extends $os.Unit {
  map: { [name: string]: $os.Pkg } = {}
  watcher = new $exOsVw.PkgsWatcher(this)

  async init() {
    await this.initWatcher()
  }

  private async initWatcher() {
    await this.watcher.start((delta, data) => {
      // Update packages
      for (const fragment of Object.values(data.fragments)) {
        const pkg = this.map[fragment.name]
        if (!pkg) continue
        pkg.update(fragment)
      }

      // Add packages
      for (const name of delta.added) {
        const fragment = data.fragments[name]
        if (!fragment) throw this.never
        this.map[name] = new $os.Pkg(this, fragment)
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
