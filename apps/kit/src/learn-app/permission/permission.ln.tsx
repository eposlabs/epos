export class Permission extends ln.Unit {
  name: chrome.runtime.ManifestPermissions
  declare private engine: any

  constructor(parent: ln.Unit, name: chrome.runtime.ManifestPermissions) {
    super(parent)
    this.name = name
  }

  init() {
    this.engine = (epos as any).engine
  }

  async play() {
    await this.engine.bus.send('Dev.testApi', this.name)
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  ui() {
    if (this.name === 'contextMenus') return
    return (
      <div class="flex flex-col">
        <button
          onClick={this.play}
          class="flex cursor-pointer gap-2 rounded-sm bg-gray-200 px-3 py-1.5 text-left hover:brightness-95 dark:bg-black"
        >
          <div>{this.name}</div>
        </button>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // VERSIONER
  // ---------------------------------------------------------------------------

  static versioner: any = {
    1() {
      delete this.granted
    },
  }
}
