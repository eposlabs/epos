import type { ActionShards } from './pkgs.sw'

export class Pkgs extends $vw.Unit {
  map: { [name: string]: $vw.Pkg } = {}
  hasPanel = false
  actionShards: ActionShards = {}
  selectedPkgName: string | null = localStorage.getItem('shell.selectedPkgName')
  dock = new $vw.PkgsDock(this)
  watcher = new $exOsVw.PkgsWatcher(this)

  get list() {
    return Object.values(this.map)
  }

  getSelected() {
    if (!this.selectedPkgName) return null
    return this.map[this.selectedPkgName] ?? null
  }

  select(name: string) {
    if (!this.map[name]) throw this.never
    this.selectedPkgName = name
    this.$.shell.refresh()
    localStorage.setItem('shell.selectedPkgName', name)
  }

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
        this.map[shard.name] = new $vw.Pkg(this, shard)
      }

      // Remove packages
      for (const name of delta.removed) {
        if (!this.map[name]) throw this.never
        delete this.map[name]
      }

      // Update data
      this.hasPanel = data.hasPanel
      this.actionShards = data.actionShards

      // Close view if nothing to show
      const noPkgs = this.list.length === 0
      const noActions = Object.keys(this.actionShards).length === 0
      if (noPkgs && noActions) {
        self.close()
        return
      }

      // Select first package if none selected
      if (!this.selectedPkgName || !this.map[this.selectedPkgName]) {
        this.selectedPkgName = this.list[0].name
      }

      // Refresh shell
      this.$.shell.refresh()
    })
  }

  ui = () => {
    if (this.list.length === 0) return null
    return (
      <div onMouseEnter={() => this.dock.hide()}>
        {this.list.map(pkg => (
          <pkg.ui key={pkg.name} />
        ))}
      </div>
    )
  }
}
