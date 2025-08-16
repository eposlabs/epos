export class Pkgs extends $os.Unit {
  map: { [name: string]: $os.Pkg } = {}
  private watcher = new $exOsVw.PkgsWatcher(this)

  async init() {
    await this.initWatcher()
  }

  private async initWatcher() {
    await this.watcher.start((delta, data) => {
      for (const name of delta.added) {
        const fragment = data.fragments[name]
        if (!fragment) throw this.never
        this.map[name] = new $os.Pkg(this, {
          name: fragment.name,
          hash: fragment.hash,
        })
      }

      for (const name of delta.updated) {
        const pkg = this.map[name]
        const fragment = data.fragments[name]
        if (!pkg || !fragment) throw this.never
        pkg.hash = fragment.hash
        pkg.reloadFrame()
      }

      for (const name of delta.removed) {
        if (!this.map[name]) throw this.never
        this.map[name].removeFrame()
        delete this.map[name]
      }
    })
  }
}
