export class App extends $gl.Unit {
  utils = new $gl.Utils(this)
  idb = new $gl.Idb(this)

  pkgs = new $gl.Pkgs(this)

  ui() {
    return (
      <div>
        <div>Devkit App</div>
        <this.pkgs.ui />
      </div>
    )
  }
}
