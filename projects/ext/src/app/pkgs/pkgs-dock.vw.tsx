import type { TargetedEvent } from 'preact/compat'

export class PkgsDock extends $vw.Unit {
  private $pkgs = this.up($vw.Pkgs)!
  private items: Array<{ name: string; value: string; label: string }> = []
  private uniqueItemNames: string[] = []
  private selectedPkg: $vw.Pkg | null = null
  private showTimeout: number | null = null
  private hideTimeout: number | null = null
  private hidden = true

  show() {
    if (this.showTimeout) self.clearTimeout(this.showTimeout)
    if (this.hideTimeout) self.clearTimeout(this.hideTimeout)
    this.showTimeout = self.setTimeout(() => {
      this.hidden = false
      this.$.shell.refresh()
    }, 50)
  }

  hide(delay = 350) {
    if (this.showTimeout) self.clearTimeout(this.showTimeout)
    if (this.hideTimeout) self.clearTimeout(this.hideTimeout)
    this.hideTimeout = self.setTimeout(() => {
      this.hidden = true
      this.$.shell.refresh()
    }, delay)
  }

  ui = () => {
    if (!this.$pkgs.selectedPkgName) return null

    this.items = this.getItems()
    this.uniqueItemNames = this.$.utils.unique(this.items.map(item => item.name))
    this.selectedPkg = this.$pkgs.getSelected()

    return (
      <div
        onMouseEnter={() => this.show()}
        class={this.$.utils.cx([
          'fixed top-0 right-0 z-10 h-28 bg-brand font-mono font-semibold text-black',
          'transition duration-200 select-none',
          this.hidden && 'transform-[translate(calc(100%-min(100%,32px)),calc(-100%+7px))] text-transparent',
        ])}
      >
        <div class="absolute -inset-x-12 -inset-y-6 z-0" />
        <div class="relative flex h-full">
          <this.Select />
          <this.ActionButton />
          <this.PanelButton />
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
        self.close()
      } else {
        this.$pkgs.select(pkgName)
        this.hide(450)
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

    return (
      <button
        onClick={() => this.processAction(selectedPkg.name)}
        class="flex h-full w-28 items-center justify-center not-only:pl-3 only:box-content only:px-2"
      >
        <div class="text-[14px]">→</div>
      </button>
    )
  }

  private PanelButton = () => {
    if (!this.$.env.is.vwPopup) return null
    if (!this.$pkgs.hasPanel) return null

    return (
      <button
        onClick={() => this.openPanel()}
        class="flex h-full w-28 items-center justify-center text-inherit only:box-content only:px-2 not-only:nth-of-type-2:pr-3"
      >
        <div class="-translate-y-1 text-[16px]">◨</div>
      </button>
    )
  }

  private getItems() {
    return [
      ...this.$pkgs.list.map(pkg => ({
        name: pkg.name,
        value: pkg.name,
        label: pkg.title ?? pkg.name,
      })),
      ...Object.values(this.$pkgs.actionShards).map(shard => ({
        name: shard.name,
        value: `action:${shard.name}`,
        label: `${shard.title ?? shard.name} →`,
      })),
    ].sort((item1, item2) => item1.label.localeCompare(item2.label))
  }

  private async processAction(pkgName: string) {
    const shard = this.$pkgs.actionShards[pkgName]
    if (!shard) throw this.never

    if (this.$.is.boolean(shard.action)) {
      const bus = this.$.bus.create(`pkg[${pkgName}]`)
      await bus.send('action')
    } else if (this.$.is.string(shard.action)) {
      await this.$.boot.medium.openTab(shard.action)
    }
  }

  private openPanel() {
    const tabId = Number(this.$.env.params.tabId)
    if (!tabId) throw this.never
    this.$.boot.medium.openPanel(tabId)
    self.close()
  }
}
