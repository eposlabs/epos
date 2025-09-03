import type { ActionMap } from './pkgs.sw'

// TODO: probably don't put 'map' in state, because it is not easy to reason about,
// state is 'old-school', just raw dynamic data and we update these data manually

export type State = {
  map: { [name: string]: $vw.Pkg }
  selectedName: string | null
  actions: ActionMap
  hasPanel: boolean
}

export class Pkgs extends $vw.Unit {
  state = this.$.libs.valtio.proxy<State>({
    map: {},
    selectedName: null,
    hasPanel: false,
    actions: {},
  })

  watcher = new $exOsVw.PkgsWatcher(this)

  async init() {
    await this.initWatcher()
  }

  private byName = (pkg1: $vw.Pkg, pkg2: $vw.Pkg) => {
    return pkg1.name.localeCompare(pkg2.name)
  }

  private async initWatcher() {
    await this.watcher.start((delta, data) => {
      for (const name of delta.added) {
        const fragment = data.fragments[name]
        if (!fragment) throw this.never
        this.state.map[fragment.name] = new $vw.Pkg(this, {
          name: fragment.name,
          hash: fragment.hash,
          popup: fragment.popup,
        })
      }

      for (const name of delta.updated) {
        const pkg = this.state.map[name]
        const fragment = data.fragments[name]
        if (!pkg || !fragment) throw this.never
        pkg.hash = fragment.hash
        pkg.popup = fragment.popup
      }

      for (const name of delta.removed) {
        if (!this.state.map[name]) throw this.never
        delete this.state.map[name]
      }

      this.state.actions = data.actions
      this.state.hasPanel = data.hasPanel

      this.update()
    })
  }

  update() {
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

  ui = () => {
    const state = this.$.libs.valtio.useSnapshot(this.state) as State
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

  Select = () => {
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
