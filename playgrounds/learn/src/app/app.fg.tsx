export class App extends $gl.App<$fg.Permission> {
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
}
