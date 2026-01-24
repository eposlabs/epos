export class Learn extends gl.Unit {
  permissions = [
    new gl.Permission(this, 'browsingData'),
    new gl.Permission(this, 'contextMenus'),
    new gl.Permission(this, 'cookies'),
    new gl.Permission(this, 'downloads'),
    new gl.Permission(this, 'notifications'),
    new gl.Permission(this, 'storage'),
  ]

  View() {
    return (
      <div className="mx-auto mt-5 mb-12 flex max-w-100 flex-col gap-3 px-5">
        <div>Test Browser API:</div>
        <div className="flex flex-col gap-1">
          {this.permissions.map(permission => (
            <permission.View key={permission.name} />
          ))}
        </div>
      </div>
    )
  }

  static versioner = this.defineVersioner({
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
    4() {
      this.permissions.push(new gl.Permission(this, 'contextMenus'))
    },
    5() {
      this.permissions = [
        new gl.Permission(this, 'browsingData'),
        new gl.Permission(this, 'contextMenus'),
        new gl.Permission(this, 'cookies'),
        new gl.Permission(this, 'downloads'),
        new gl.Permission(this, 'notifications'),
        new gl.Permission(this, 'storage'),
      ]
    },
  })
}
