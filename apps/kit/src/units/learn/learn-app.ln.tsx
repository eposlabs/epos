export class LearnApp extends ln.Unit {
  permissions = [
    new ln.Permission(this, 'browsingData'),
    new ln.Permission(this, 'contextMenus'),
    new ln.Permission(this, 'cookies'),
    new ln.Permission(this, 'downloads'),
    new ln.Permission(this, 'notifications'),
    new ln.Permission(this, 'storage'),
  ]

  async init() {
    this.setupContextMenu()
  }

  private async setupContextMenu() {
    await epos.browser.contextMenus.removeAll()

    epos.browser.contextMenus.create({
      id: 'open',
      title: 'Open epos.dev',
      contexts: ['all'],
    })

    epos.browser.contextMenus.onClicked.addListener(async info => {
      if (info.menuItemId === 'open') {
        await epos.browser.tabs.create({ url: 'https://epos.dev', active: true })
      }
    })
  }

  View() {
    return (
      <div className="mx-auto mt-5 mb-12 flex max-w-100 flex-col gap-3 px-5">
        <div>Test Browser API:</div>
        <div className="flex flex-col gap-1">
          {this.permissions.map(permission => (
            <permission.ui key={permission.name} />
          ))}
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // VERSIONER
  // ---------------------------------------------------------------------------

  static versioner: any = {
    1() {
      this.permissions = []
    },
    2() {
      this.permissions = [
        new ln.Permission(this, 'contextMenus'),
        new ln.Permission(this, 'cookies'),
        new ln.Permission(this, 'downloads'),
        new ln.Permission(this, 'notifications'),
        new ln.Permission(this, 'storage'),
      ]
    },
    3() {
      this.permissions.push(new ln.Permission(this, 'browsingData'))
    },
  }
}

// ---------------------------------------------------------------------------
// PERMISSION
// ---------------------------------------------------------------------------

export class Permission extends ln.Unit {
  name: chrome.runtime.ManifestPermission
  declare private engine: any

  constructor(parent: ln.Unit, name: chrome.runtime.ManifestPermission) {
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
