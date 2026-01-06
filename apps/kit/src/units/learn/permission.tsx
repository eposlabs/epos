export class Permission extends gl.Unit {
  name: chrome.runtime.ManifestPermission

  constructor(parent: gl.Unit, name: chrome.runtime.ManifestPermission) {
    super(parent)
    this.name = name
  }

  async play() {
    if (this.name === 'contextMenus') {
      await epos.browser.contextMenus.removeAll()

      epos.browser.contextMenus.create({
        id: 'remove-all-context-menus',
        title: 'Remove all context menus',
        contexts: ['all'],
      })

      epos.browser.contextMenus.onClicked.addListener(async info => {
        if (info.menuItemId === 'remove-all-context-menus') {
          await epos.browser.contextMenus.removeAll()
        }
      })
    } else {
      await epos.engine.bus.send('Dev.testApi', this.name)
    }
  }

  View() {
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

  static versioner = this.defineVersioner({
    1() {
      Reflect.deleteProperty(this, 'granted')
    },
  })
}
