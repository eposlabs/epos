import type { ActionData } from './pack.sw'

export class Pack extends $vw.Unit {
  pkgs: { [name: string]: $vw.Pkg } = {}
  hasPanel = false
  actionData: ActionData = {}
  selectedPkgName: string | null = localStorage.getItem('pkgs.selectedPkgName')
  dock = new $vw.PackDock(this)
  watcher = new $exOsVw.PackWatcher(this)

  list() {
    return Object.values(this.pkgs)
  }

  static async create(parent: $vw.Unit) {
    const pack = new Pack(parent)
    await pack.init()
    return pack
  }

  private async init() {
    await this.initWatcher()
  }

  getSelected() {
    if (!this.selectedPkgName) return null
    return this.pkgs[this.selectedPkgName] ?? null
  }

  select(name: string) {
    if (!this.pkgs[name]) throw this.never
    this.selectedPkgName = name
    this.$.refresh()
    localStorage.setItem('pkgs.selectedPkgName', name)
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
        this.pkgs[meta.name] = new $vw.Pkg(this, meta)
      }

      // Remove packages
      for (const name of delta.removed) {
        if (!this.pkgs[name]) throw this.never
        delete this.pkgs[name]
      }

      // Update data
      this.hasPanel = data.hasPanel
      this.actionData = data.action

      // Close view if nothing to show
      const noPack = this.list().length === 0
      const noActions = Object.keys(this.actionData).length === 0
      if (noPack && noActions) {
        self.close()
        return
      }

      // Select first package if none selected
      if (!this.selectedPkgName || !this.pkgs[this.selectedPkgName]) {
        this.selectedPkgName = this.list()[0].name
      }

      // Refresh UI
      this.$.refresh()
    })
  }

  ui = () => {
    if (this.list.length === 0) return null
    return (
      <div onMouseEnter={() => this.dock.hide()}>
        {this.list().map(pkg => (
          <pkg.ui key={pkg.name} />
        ))}
      </div>
    )
  }
}
