export class Pkgs extends $os.Unit {
  map: { [name: string]: $os.Pkg } = {}
  watcher = new $exOsVw.PkgsWatcher(this)

  async init() {
    await this.initWatcher()
  }

  private async initWatcher() {
    await this.watcher.start((delta, data) => {
      // Update packages
      for (const shard of Object.values(data.invokeShards)) {
        const pkg = this.map[shard.name]
        if (!pkg) continue
        pkg.update(shard)
      }

      // Add packages
      for (const name of delta.added) {
        const shard = data.invokeShards[name]
        if (!shard) throw this.never
        this.map[name] = new $os.Pkg(this, shard)
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
