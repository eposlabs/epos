export class BootInjector extends $ex.Unit {
  constructor(parent: $ex.Unit) {
    super(parent)
    async: this.init()
  }

  private async init() {
    // Wait till engine is ready
    await this.$.waitReady()

    if (this.$.env.is.exTab) {
      this.initPkgs()
    } else if (this.$.env.is.exFrame) {
      this.initEposVar()
      this.initEposElement()
      await this.injectPackages()
      this.initPkgs()
    }
  }

  private async initEposVar() {
    self.__epos = {} as EposVar
  }

  private async initEposElement() {
    const element = document.createElement('epos')
    document.documentElement.prepend(element)
    self.__epos.element = element
  }

  private async injectPackages() {
    // Inject lite js
    const liteJs = await this.$.bus.send<string>('pkgs.getLiteJs', location.href)
    if (liteJs) await this.injectJs(liteJs)

    // Inject css
    const css = await this.$.bus.send<string>('pkgs.getCss', location.href)
    if (css) this.injectCss(css)

    // Inject pkg defs
    const defs = await this.$.bus.send<string[]>('pkgs.getDefs', location.href)
    if (defs.length === 0) return
    await this.injectJs(`self.__epos.defs = [${defs.join(',')}]`)
  }

  private async injectJs(js: string) {
    const ready$ = Promise.withResolvers()
    const blob = new Blob([js], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    const script = document.createElement('script')
    script.epos = true
    script.src = url
    script.onload = () => ready$.resolve(true)
    self.__epos.element.prepend(script)
    await ready$.promise
    URL.revokeObjectURL(url)
  }

  private injectCss(css: string) {
    const blob = new Blob([css], { type: 'text/css' })
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.epos = true
    link.href = URL.createObjectURL(blob)
    self.__epos.element.prepend(link)
  }

  private initPkgs() {
    const defs = self.__epos.defs
    const tabId = this.getTabId()
    // this.deleteEposVar()

    for (const def of defs) {
      // Create pkg
      const pkg = this.$.pkgs.create({
        name: def.name,
        icon: def.icon,
        title: def.title,
        tabId: tabId,
        shadowCss: def.shadowCss,
      })

      // Execute def fn
      const epos = pkg.api.create()
      def.fn.call(undefined, epos)
    }
  }

  private getTabId() {
    if (this.$.env.is.exFrame) return Number(this.$.env.params.tabId)
    if (!this.$.is.number(self.__epos.tabId)) throw this.never
    return self.__epos.tabId
  }

  private deleteEposVar() {
    Reflect.deleteProperty(self, '__epos')
  }
}
