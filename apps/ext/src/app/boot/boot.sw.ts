export class Boot extends sw.Unit {
  action = new sw.BootAction(this)
  injector = new sw.BootInjector(this)

  async init() {
    await this.injector.init()
  }
}
