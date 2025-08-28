export class App extends $vw.Unit {
  browser = chrome
  libs = new $osVw.Libs(this)
  utils = new $exOsSwVw.Utils(this)
  is = this.utils.is
  safe = this.utils.safe
  bind = this.utils.bind
  env = new $gl.Env(this)
  bus = new $gl.Bus(this)

  boot = new $vw.Boot(this)
  dev = new $vw.Dev(this)
  pkgs = new $vw.Pkgs(this)
  shell = new $vw.Shell(this)
  tools = new $vw.Tools(this)

  async init() {
    self.$ = this
    await this.tools.init()
    await this.pkgs.init()
    await this.shell.init()
  }
}
