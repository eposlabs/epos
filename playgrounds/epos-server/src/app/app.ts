declare global {
  var $: App
}

// TODO: check root exists
export class App extends $gl.Unit {
  libs = new $gl.Libs(this)
  utils = new $gl.Utils(this)

  port = 2093
  root = this.$.libs.path.resolve(process.argv[2] ?? process.cwd())

  host = new $gl.Host(this)
  pkgs = new $gl.Pkgs(this)

  async setup() {
    global.$ = this

    // Don't show errors on Ctrl+C
    process.on('SIGINT', () => process.exit(0))

    await this.checkRootExists()
    await this.host.setup()
    await this.pkgs.setup()
  }

  private async checkRootExists() {
    const exists = await this.utils.pathExists(this.root)
    if (exists) return
    console.error(`Directory ${this.root} does not exist`)
    process.exit(1)
  }
}

/*
  async init() {
    this._checkRootExists()
    await this.host.init()
    await this.scanner.init()
  }

  async _checkRootExists() {
    const exists = await this._exists(this.root)
    if (exists) return
    console.error(`🔴 Directory ${this.root} does not exist`)
    process.exit(1)
  }


  async _exists(path) {
    try {
      await this.fs.access(path, this.fs.constants.F_OK)
      return true
    } catch {
      return false
    }
  }
    */
