export class Boot extends sw.Unit {
  injector = new sw.BootInjector(this)

  async init() {
    await this.injector.init()
  }
}
