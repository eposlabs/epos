export class App extends $gl.Unit {
  utils = new $gl.Utils(this)
  idb = new $gl.Idb(this)
  pkgs: $gl.Pkg[] = []

  ui() {
    return (
      <div>
        <div>Devkit App</div>
        <div>
          <button>ADD PACKAGE</button>
        </div>
      </div>
    )
  }

  static versioner: any = {
    38() {
      this.idb = new $gl.Idb(this)
    },
  }
}
