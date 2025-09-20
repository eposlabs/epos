export class App {
  utils = new $gl.Utils(this)
  // idb = new $gl.Idb(this)
  // pkgs = new $gl.Pkgs(this)

  ui() {
    return (
      <div>
        <div>Devkit App</div>
        {/* <this.pkgs.ui /> */}
      </div>
    )
  }

  static versioner: any = {
    1() {
      this.utils = new $gl.Utils(this)
    },
    2() {
      this.utils = new $gl.Utils(this)
      console.warn(this.utils)
    },
    3() {
      this.utils = new $gl.Utils(this)
    },
    4() {
      console.warn('4')
    },
    13() {
      this.utils = new $gl.Utils(this)
    },
  }
}
