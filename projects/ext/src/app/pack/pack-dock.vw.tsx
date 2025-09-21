import type { TargetedEvent } from 'preact'

export class PackDock extends $vw.Unit {
  private $pack = this.up($vw.Pack)!
  private items: Array<{ name: string; value: string; label: string }> = []
  private uniqueItemNames: string[] = []
  private selectedPkg: $vw.Pkg | null = null
  private hidden = true
  private timeout: number | undefined = undefined

  show() {
    self.clearTimeout(this.timeout)
    this.timeout = self.setTimeout(() => {
      this.hidden = false
      this.$.refresh()
    }, 50)
  }

  hide() {
    self.clearTimeout(this.timeout)
    this.timeout = self.setTimeout(() => {
      this.hidden = true
      this.$.refresh()
    }, 150)
  }

  hideWithBigDelay() {
    self.clearTimeout(this.timeout)
    this.timeout = self.setTimeout(() => this.hide(), 1000)
  }

  ui = () => {
    if (!this.$pack.selectedPkgName) return null

    this.items = this.getItems()
    this.uniqueItemNames = this.$.utils.unique(this.items.map(item => item.name))
    this.selectedPkg = this.$pack.getSelected()

    return (
      <div
        onMouseEnter={() => this.show()}
        onMouseLeave={() => this.hideWithBigDelay()}
        class={this.$.utils.cx([
          'fixed top-0 right-0 z-10 h-28 bg-brand font-mono font-semibold text-black',
          'transition delay-30 duration-200 select-none',
          this.hidden && 'transform-[translate(calc(100%-min(100%,32px)),calc(-100%+7px))] text-transparent',
        ])}
      >
        <div data-hitbox class="absolute -inset-x-8 -inset-y-6 z-0" />
        <div class="relative flex h-full">
          <this.Select />
          <this.ActionButton />
          <this.SidePanelButton />
        </div>
      </div>
    )
  }

  Select = () => {
    if (this.uniqueItemNames.length === 1) return null
    if (!this.selectedPkg) return null

    const onChange = async (e: TargetedEvent<HTMLSelectElement>) => {
      const value = e.currentTarget.value
      const isAction = value.startsWith('action:')
      const pkgName = isAction ? value.replace('action:', '') : value

      if (isAction) {
        await this.processAction(pkgName)
      } else {
        this.$pack.select(pkgName)
        this.hide()
      }
    }

    return (
      <div class="relative flex h-full items-center gap-5 pr-8 pl-9">
        <div class="text-[12px]">{this.selectedPkg.title ?? this.selectedPkg.name}</div>
        <div class="mr-2 -translate-y-0.5 scale-x-[1.3] pl-2 text-[7px]">▼</div>

        {/* Native select */}
        <select
          value={this.selectedPkg.name}
          onChange={onChange}
          class="absolute inset-0 opacity-0 outline-none"
        >
          {this.items.map(item => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  private ActionButton = () => {
    if (this.uniqueItemNames.length > 1) return null
    const selectedPkg = this.selectedPkg
    if (!selectedPkg) return null
    const meta = this.$pack.actionData[selectedPkg.name]
    if (!meta) return null

    return (
      <button
        onClick={() => this.processAction(selectedPkg.name)}
        class="flex h-full w-28 items-center justify-center not-only:pl-3 only:box-content only:px-2"
      >
        <div class="text-[14px]">→</div>
      </button>
    )
  }

  private SidePanelButton = () => {
    if (!this.$.env.is.vwPopup) return null
    if (!this.$pack.hasSidePanel) return null

    return (
      <button
        onClick={() => this.openSidePanel()}
        class="flex h-full w-28 items-center justify-center text-inherit only:box-content only:px-2 not-only:nth-of-type-2:pr-3"
      >
        <div class="-translate-y-1 text-[16px]">◨</div>
      </button>
    )
  }

  private getItems() {
    return [
      ...this.$pack.list().map(pkg => ({
        name: pkg.name,
        value: pkg.name,
        label: pkg.title ?? pkg.name,
      })),
      ...Object.values(this.$pack.actionData).map(meta => ({
        name: meta.name,
        value: `action:${meta.name}`,
        label: `${meta.title ?? meta.name} →`,
      })),
    ].sort((item1, item2) => item1.label.localeCompare(item2.label))
  }

  private async processAction(pkgName: string) {
    const meta = this.$pack.actionData[pkgName]
    if (!meta) throw this.never

    if (this.$.is.boolean(meta.action)) {
      const bus = this.$.bus.create(`pkg[${pkgName}]`)
      await bus.send('action')
    } else if (this.$.is.string(meta.action)) {
      await this.$.boot.medium.openTab(meta.action)
    }

    self.close()
  }

  private openSidePanel() {
    const tabId = Number(this.$.env.params.tabId)
    if (!tabId) throw this.never
    this.$.boot.medium.openSidePanel(tabId)
    self.close()
  }
}
