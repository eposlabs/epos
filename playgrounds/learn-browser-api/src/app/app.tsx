import { list } from './app-permission-list'

export class App extends $gl.Unit {
  declare $epos: any
  permissions = list.map(name => new $gl.Permission(name))

  ui() {
    return (
      <div class="mx-auto mt-20 mb-60 flex max-w-400 flex-col gap-12 px-20">
        <div>Request Permission:</div>
        <div class="flex flex-col gap-4">
          {this.permissions.map(permission => (
            <permission.ui key={permission.name} />
          ))}
        </div>
      </div>
    )
  }

  static v = {
    24(this: any) {
      console.warn('START VERSIONER', this.permissions[0].ui)
      this.permissions = [new $gl.Permission(list[0])] // list.map(name => new $gl.Permission(name))
      console.warn('END VERSIONER', this.permissions[0].ui)
    },
  }
}
