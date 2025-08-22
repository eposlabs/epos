type State = {
  expanded: boolean
}

export class Permission extends $gl.Unit {
  name: chrome.runtime.ManifestPermissions
  granted = false
  declare private state: State

  constructor(name: chrome.runtime.ManifestPermissions) {
    super()
    this.name = name
  }

  async init() {
    this.state = epos.mobx.observable<State>({ expanded: false })
    await this.updateGranted()
  }

  ui() {
    const onClick = async () => {
      if (this.granted) {
        this.state.expanded = !this.state.expanded
      } else {
        await this.request()
      }
    }

    return (
      <div class="flex flex-col">
        <button
          onClick={onClick}
          class="flex cursor-pointer gap-8 rounded-sm bg-gray-200 px-12 py-6 text-left hover:brightness-95"
        >
          <div>{this.granted ? '✅' : '🚫'}</div>
          <div>{this.name}</div>
        </button>
        {this.state.expanded && <div class="h-200 border-2 border-black">FORM</div>}
      </div>
    )
  }

  private async request() {
    await epos.browser.permissions.request({ permissions: [this.name] })
    await this.updateGranted()
  }

  private async updateGranted() {
    this.granted = await epos.browser.permissions.contains({ permissions: [this.name] })
  }
}
