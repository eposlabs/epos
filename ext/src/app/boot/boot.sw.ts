export class Boot extends $sw.Unit {
  action = new $sw.BootAction(this)
  injector = new $sw.BootInjector(this)
  medium = new $swVw.BootMedium(this)

  static async create(parent: $sw.Unit) {
    const boot = new Boot(parent)
    await boot.init()
    return boot
  }

  private async init() {
    await this.injector.init()
  }
}
