export class Pack extends $os.Unit {
  pkgs: { [name: string]: $os.Pkg } = {}
  watcher = new $exOsVw.PackWatcher(this)

  static async create(parent: $os.Unit) {
    const pack = new Pack(parent)
    await pack.init()
    return pack
  }

  private async init() {
    await this.initWatcher()
  }

  private async initWatcher() {
    await this.watcher.start((delta, data) => {
      // Update packages
      for (const meta of Object.values(data.execution)) {
        const pkg = this.pkgs[meta.name]
        if (!pkg) continue
        pkg.update(meta)
      }

      // Add packages
      for (const name of delta.added) {
        const meta = data.execution[name]
        if (!meta) throw this.never
        this.pkgs[name] = new $os.Pkg(this, meta)
      }

      // Remove packages
      for (const name of delta.removed) {
        const pkg = this.pkgs[name]
        if (!pkg) throw this.never
        pkg.removeFrame()
        delete this.pkgs[name]
      }
    })
  }
}
