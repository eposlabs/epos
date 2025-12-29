export class Permission extends gl.Unit {
  name: chrome.runtime.ManifestPermission

  constructor(parent: gl.Unit, name: chrome.runtime.ManifestPermission) {
    super(parent)
    this.name = name
  }

  async play() {
    await epos.engine.bus.send('Dev.testApi', this.name)
  }

  ui() {
    if (this.name === 'contextMenus') return
    return (
      <div className="flex flex-col">
        <button
          onClick={this.play}
          className="flex cursor-pointer gap-2 rounded-sm bg-gray-200 px-3 py-1.5 text-left hover:brightness-95 dark:bg-black"
        >
          <div>{this.name}</div>
        </button>
      </div>
    )
  }

  static versioner: any = {
    1() {
      delete this.granted
    },
  }
}
