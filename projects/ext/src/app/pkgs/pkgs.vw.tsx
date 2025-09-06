import type { TargetedEvent } from 'preact/compat'
import type { Actions } from './pkgs.sw'

export class Pkgs extends $vw.Unit {
  map: { [name: string]: $vw.Pkg } = {}
  watcher = new $exOsVw.PkgsWatcher(this)
  selectedPkgName: string | null = null
  private actions: Actions = {}
  private hasPanel = false

  get list() {
    return Object.values(this.map)
  }

  private get listSortedByName() {
    return this.list.toSorted((pkg1, pkg2) => pkg1.name.localeCompare(pkg2.name))
  }

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
        this.map[fragment.name] = new $vw.Pkg(this, fragment)
      }

      // Remove packages
      for (const name of delta.removed) {
        if (!this.map[name]) throw this.never
        delete this.map[name]
      }

      // Close view if nothing to show
      const noPkgs = this.list.length === 0
      const noActions = Object.keys(data.actions).length === 0
      if (noPkgs && noActions) {
        self.close()
        return
      }

      // Select first package if none selected
      if (!this.selectedPkgName || !this.map[this.selectedPkgName]) {
        this.selectedPkgName = this.listSortedByName[0].name
      }

      // Update data
      this.actions = data.actions
      this.hasPanel = data.hasPanel

      // Refresh shell
      this.$.shell.refresh()
    })
  }

  private selectPkg(pkgName: string) {
    this.selectedPkgName = pkgName
    this.$.shell.refresh()
  }

  private async processAction(pkgName: string) {
    const action = this.actions[pkgName]
    if (!action) throw this.never

    if (this.$.is.boolean(action)) {
      const bus = this.$.bus.create(`pkg[${pkgName}]`)
      await bus.send('action')
    } else {
      await this.$.boot.medium.openTab(action)
    }

    self.close()
  }

  private openPanel() {
    const tabId = Number(this.$.env.params.tabId)
    if (!tabId) throw this.never
    this.$.boot.medium.openPanel(tabId)
    self.close()
  }

  ui = () => {
    this.$.libs.preact.useContext(this.$.shell.context)
    if (this.list.length === 0) return null

    return (
      <div>
        {this.listSortedByName.map(pkg => (
          <pkg.ui key={pkg.name} />
        ))}
      </div>
    )
  }

  Dock = () => {
    this.$.libs.preact.useContext(this.$.shell.context)
    if (!this.selectedPkgName) return null

    return (
      <div class="fixed top-0 right-0 z-10 flex h-28 bg-brand font-mono font-semibold select-none">
        <this.Select />
        <this.ActionButton />
        <this.SidePanelButton />
      </div>
    )
  }

  private Select = () => {
    this.$.libs.preact.useContext(this.$.shell.context)
    if (!this.selectedPkgName) return null
    if (this.list.length === 1) return null
    const selectedPkg = this.map[this.selectedPkgName]

    const onChange = async (e: TargetedEvent<HTMLSelectElement>) => {
      const value = e.currentTarget.value
      const isAction = value.startsWith('action:')
      const pkgName = isAction ? value.replace('action:', '') : value

      if (isAction) {
        await this.processAction(pkgName)
      } else {
        this.selectPkg(pkgName)
      }
    }

    return (
      <div class="relative flex h-full items-center gap-5 pr-8 pl-9">
        <div class="text-[12px]">{selectedPkg.label}</div>
        <div class="mr-2 -translate-y-0.5 scale-x-[1.3] pl-2 text-[7px]">▼</div>

        {/* Native select */}
        <select
          value={this.selectedPkgName}
          onChange={onChange}
          class="absolute inset-0 opacity-0 outline-none"
        >
          {this.listSortedByName.map(pkg => (
            <this.$.libs.preact.Fragment key={pkg.name}>
              <option value={pkg.name}>{pkg.label}</option>
              {this.actions[pkg.name] && (
                <option key={`action:${pkg.name}`} value={`action:${pkg.name}`}>
                  {pkg.label} →
                </option>
              )}
            </this.$.libs.preact.Fragment>
          ))}
        </select>
      </div>
    )
  }

  private ActionButton = () => {
    this.$.libs.preact.useContext(this.$.shell.context)
    if (this.list.length > 1) return null
    const selectedPkgName = this.selectedPkgName
    if (!selectedPkgName) return null
    if (!this.actions[selectedPkgName]) return null

    return (
      <button
        onClick={() => this.processAction(selectedPkgName)}
        class="flex h-full w-28 items-center justify-center not-only:pl-3 only:box-content only:px-2"
      >
        <div class="text-[14px]">→</div>
      </button>
    )
  }

  private SidePanelButton = () => {
    this.$.libs.preact.useContext(this.$.shell.context)
    if (!this.$.env.is.vwPopup) return null
    if (!this.hasPanel) return null

    return (
      <button
        onClick={() => this.openPanel()}
        class="flex h-full w-28 items-center justify-center only:box-content only:px-2 not-only:nth-of-type-2:pr-3"
      >
        <div class="-translate-y-1 text-[16px]">◨</div>
      </button>
    )
  }
}
