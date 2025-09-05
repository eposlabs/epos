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

  get listSortedByName() {
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

    return (
      <div
        class={this.$.utils.cx([
          'fixed top-0 right-0 z-10 flex h-30 rounded-bl-lg bg-brand',
          'font-mono font-medium',
        ])}
      >
        <this.Select />
        <this.ActionButton />
        <this.SidePanelButton />
      </div>
    )
  }

  private Select = () => {
    if (this.list.length === 0) return null
    if (!this.selectedPkgName) return null
    const selectedPkg = this.map[this.selectedPkgName]
    if (!selectedPkg) return null

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

    if (this.list.length === 1) return null

    return (
      <div>
        {/* Select UI */}
        <div class="flex h-full items-center gap-6 pr-8 pl-12">
          <div class="text-[12px]/[1]">{selectedPkg.label}</div>
          {this.list.length > 1 && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="size-14"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          )}
        </div>

        {/* Native select */}
        {this.list.length > 1 && (
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
        )}
      </div>
    )
  }

  private ActionButton = () => {
    if (!this.selectedPkgName) return null

    return (
      <button
        onClick={() => this.processAction(this.selectedPkgName)}
        class="z-10 flex size-30 items-center justify-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-14"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </button>
    )
  }

  private SidePanelButton = () => {
    // if (!this.$.env.is.vwPopup) return null
    // if (!this.hasPanel) return null

    return (
      <button onClick={() => this.openPanel()} class="z-10 flex size-30 items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-14"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M15 3v18" />
        </svg>
      </button>
    )
  }
}
