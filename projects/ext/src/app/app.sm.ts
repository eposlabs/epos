export class App extends $sm.Unit {
  browser = chrome
  utils = new $sm.Utils(this)
  is = this.utils.is
  env = new $gl.Env(this)
  bus = new $gl.Bus(this)

  async init() {
    console.warn('init system')
  }
}
