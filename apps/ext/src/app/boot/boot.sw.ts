export class Boot extends sw.Unit {
  action = new sw.BootAction(this)
  injector = new sw.BootInjector(this)
  medium = new swVw.BootMedium(this)

  static async init(parent: sw.Unit) {
    const i = new this(parent)
    await i.init()
    return i
  }

  private async init() {
    await this.injector.init()
  }
}
