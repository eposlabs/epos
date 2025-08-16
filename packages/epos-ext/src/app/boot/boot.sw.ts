export class Boot extends $sw.Unit {
  private action = new $sw.BootAction(this)
  private injector = new $sw.BootInjector(this)
  private medium = new $swVw.BootMedium(this)

  get internal() {
    return {
      medium: this.medium,
    }
  }
}
