import type { ChangeEvent } from 'react'

export class Pkgs extends $vw.Unit {
  map: { [name: string]: $vw.Pkg } = {}
  watcher = new $exOsVw.PkgsWatcher(this)

  get list() {
    return Object.values(this.map)
  }

  get sortedByName() {
    return this.list.toSorted((pkg1, pkg2) => pkg1.name.localeCompare(pkg2.name))
  }

  async init() {
    await this.initWatcher()
  }

  private async initWatcher() {
    await this.watcher.start((delta, data) => {
      // Add packages
      for (const name of delta.added) {
        const fragment = data.fragments[name]
        if (!fragment) throw this.never
        this.map[fragment.name] = new $vw.Pkg(this, fragment)
      }

      // Update packages
      for (const name of delta.updated) {
        const pkg = this.map[name]
        const fragment = data.fragments[name]
        if (!pkg || !fragment) throw this.never
        pkg.update(fragment)
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
      }

      // Update shell state
      this.$.shell.update(state => {
        const firstPkgName = this.sortedByName[0].name
        state.selectedPkgName = firstPkgName
        state.activePkgNames.add(firstPkgName)
        state.actions = data.actions
        state.hasPanel = data.hasPanel
        delta.removed.forEach(name => state.activePkgNames.delete(name))
      })
    })
  }

  ui = () => {
    return (
      <div>
        {this.list.map(pkg => {
          return <pkg.ui key={pkg.name} />
        })}
      </div>
    )
  }

  Dock = () => {
    const state = this.$.libs.preact.useContext(this.$.shell.context)
    if (!state.selectedPkgName) return null

    const onChange = (e: ChangeEvent<HTMLSelectElement>) => {
      this.$.shell.update(state => {
        const pkgName = e.target.value
        state.selectedPkgName = pkgName
        state.activePkgNames.add(pkgName)
      })
    }

    return (
      <div>
        <select value={state.selectedPkgName} onChange={onChange}>
          {this.sortedByName.map(pkg => (
            <option key={pkg.name} value={pkg.name}>
              {pkg.title ?? pkg.name}
            </option>
          ))}
        </select>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // OLD
  // ---------------------------------------------------------------------------

  private byName = (pkg1: $vw.Pkg, pkg2: $vw.Pkg) => {
    return pkg1.name.localeCompare(pkg2.name)
  }

  __update() {
    if (!this.state.selectedName || !this.state.map[this.state.selectedName]) {
      this.state.selectedName = Object.keys(this.state.map)[0] ?? null
      const pkg = this.state.map[this.state.selectedName]
      if (pkg) pkg.visited = true
    }

    if (Object.keys(this.state.map).length === 0 && Object.keys(this.state.actions).length <= 1) {
      self.close()
    }

    if (this.$.env.is.vwPopup) {
      if (!this.state.selectedName) return
      const pkg = this.state.map[this.state.selectedName]
      if (!pkg) return
      document.documentElement.style.width = `${pkg.popup.width}px`
      document.documentElement.style.height = `${pkg.popup.height}px`
    }
  }

  _ui = () => {
    const state = this.state
    const pkgs = Object.values(state.map).sort(this.byName)

    // const onSelect = () => {
    //   this.state.selectedName = pkgs[0]?.name ?? null
    // }

    return (
      <div className="">
        {pkgs.map(pkg => {
          return <pkg.ui key={pkg.name} />
          // if (state.selectedName !== pkg.name) return null
          // return (
          //   <div className="m-2 border-2 border-amber-500">
          //     <pkg.ui key={pkg.hash} />
          //   </div>
          // )
        })}
      </div>
    )
  }

  _Select = () => {
    const state = this.$.libs.valtio.useSnapshot(this.state) as State
    if (!state.selectedName) return null

    return (
      <div className="fixed top-0 right-0 flex items-center gap-4 rounded-bl-xl bg-[#e9ff01] py-4 pr-8 pl-8 font-mono">
        <div className="font-[12px]">{state.selectedName}</div>
        <svg className="size-[10px]" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3.5 5.25L7 8.75L10.5 5.25"
            stroke="#181D27"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <select
          className="absolute top-0 right-0 bottom-0 left-0 opacity-0"
          value={state.selectedName}
          onChange={e => {
            if (e.target.value.startsWith('action-')) {
              const name = e.target.value.replace('action-', '')
              const url = state.actions[name]
              if (!url) throw new Error(`Action ${name} not found`)
              self.open(url, '_blank')
              return
            }
            this.state.selectedName = e.target.value
            this.update()
          }}
        >
          {Object.values(state.map)
            .sort(this.byName)
            .map(pkg => (
              <option key={pkg.name} value={pkg.name}>
                {pkg.name}
              </option>
            ))}

          <option disabled>———</option>

          {Object.keys(state.actions).map(name => (
            <option key={name} value={`action-${name}`}>
              ↗ {name}
            </option>
          ))}
        </select>
      </div>
    )
  }
}
