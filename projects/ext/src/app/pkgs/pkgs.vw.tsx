import type { ActionData } from './pkgs.sw'

export class Pkgs extends $vw.Unit {
  map: { [name: string]: $vw.Pkg } = {}
  hasPanel = false
  actionData: ActionData = {}
  selectedPkgName: string | null = localStorage.getItem('pkgs.selectedPkgName')
  dock = new $vw.PkgsDock(this)
  watcher = new $exOsVw.PkgsWatcher(this)

  get list() {
    return Object.values(this.map)
  }

  static async create(parent: $vw.Unit) {
    const pkgs = new Pkgs(parent)
    await pkgs.init()
    return pkgs
  }

  private async init() {
    await this.initWatcher()
  }

  getSelected() {
    if (!this.selectedPkgName) return null
    return this.map[this.selectedPkgName] ?? null
  }

  select(name: string) {
    if (!this.map[name]) throw this.never
    this.selectedPkgName = name
    this.$.refresh()
    localStorage.setItem('pkgs.selectedPkgName', name)
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
        this.map[meta.name] = new $vw.Pkg(this, meta)
      }

      // Remove packages
      for (const name of delta.removed) {
        if (!this.map[name]) throw this.never
        delete this.map[name]
      }

      // Update data
      this.hasPanel = data.hasPanel
      this.actionData = data.action

      // Close view if nothing to show
      const noPkgs = this.list.length === 0
      const noActions = Object.keys(this.actionData).length === 0
      if (noPkgs && noActions) {
        self.close()
        return
      }

      // Select first package if none selected
      if (!this.selectedPkgName || !this.map[this.selectedPkgName]) {
        this.selectedPkgName = this.list[0].name
      }

      // Refresh UI
      this.$.refresh()
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
