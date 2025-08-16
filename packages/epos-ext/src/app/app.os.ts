export class App extends $os.Unit {
  browser = chrome
  libs = new $osVw.Libs(this)
  utils = new $exOsSwVw.Utils(this)
  is = this.utils.is
  safe = this.utils.safe
  bind = this.utils.bind
  env = new $gl.Env(this)
  bus = new $gl.Bus(this)

  alive = new $os.Alive(this)
  dev = new $os.Dev(this)
  peer = new $exOs.Peer(this)
  pkgs = new $os.Pkgs(this)

  async init() {
    self.$ = this
    this.utils.initOs()
    await this.pkgs.init()
  }
}

// await this.peer.mutex('start', async () => {
//   await this.alive.init()
//   await this.kick.init()
//   this._setupUtils()
// })

// _setupUtils() {
//   this.$.bus.on('utils.convertImage', this.$.utils.convertImage)
// }
