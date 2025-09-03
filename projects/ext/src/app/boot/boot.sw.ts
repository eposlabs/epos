export class Boot extends $sw.Unit {
  action = new $sw.BootAction(this)
  injector = new $sw.BootInjector(this)
  medium = new $swVw.BootMedium(this)

  async init() {
    await this.injector.init()
  }
}
