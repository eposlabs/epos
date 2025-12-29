export class Learn extends gl.Unit {
  permissions = [
    new gl.Permission(this, 'browsingData'),
    new gl.Permission(this, 'contextMenus'),
    new gl.Permission(this, 'cookies'),
    new gl.Permission(this, 'downloads'),
    new gl.Permission(this, 'notifications'),
    new gl.Permission(this, 'storage'),
  ]

  async attach() {
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
        new gl.Permission(this, 'contextMenus'),
        new gl.Permission(this, 'cookies'),
        new gl.Permission(this, 'downloads'),
        new gl.Permission(this, 'notifications'),
        new gl.Permission(this, 'storage'),
      ]
    },
    3() {
      this.permissions.push(new gl.Permission(this, 'browsingData'))
    },
  }
}
