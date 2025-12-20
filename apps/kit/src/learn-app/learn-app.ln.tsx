export class LearnApp extends ln.Unit {
  permissions = [
    new ln.Permission(this, 'contextMenus'),
    new ln.Permission(this, 'cookies'),
    new ln.Permission(this, 'downloads'),
    new ln.Permission(this, 'notifications'),
    new ln.Permission(this, 'storage'),
    new ln.Permission(this, 'browsingData'),
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

  // ---------------------------------------------------------------------------
  // VIEW
  // ---------------------------------------------------------------------------

  View() {
    return (
      <div class="mx-auto mt-5 mb-12 flex max-w-100 flex-col gap-3 px-5">
        <div>Test Browser API:</div>
        <div class="flex flex-col gap-1">
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
