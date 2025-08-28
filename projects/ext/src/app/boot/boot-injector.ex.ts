export class BootInjector extends $ex.Unit {
  constructor(parent: $ex.Unit) {
    super(parent)
    async: this.init()
  }

  private async init() {
    // Wait till engine is ready
    await this.$.waitReady()

    if (this.$.env.is.exTab) {
      this.callPkgs()
    } else if (this.$.env.is.exFrame) {
      this.initEposVar()
      this.initEposElement()
      await this.injectPackages()
      this.callPkgs()
    }
  }

  private async initEposVar() {
    self.__epos = {} as EposExContext
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

    // Inject js (includes shadow css)
    const js = await this.$.bus.send<string>('pkgs.getJs', location.href)
    if (js) await this.injectJs(js)
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

  private callPkgs() {
    const tabId = this.getTabId()
    const pkgDefs = self.__epos.pkgDefs
    Reflect.deleteProperty(self, '__epos')

    for (const def of pkgDefs) {
      const pkg = this.$.pkgs.create({
        name: def.name,
        icon: def.icon,
        title: def.title,
        shadowCss: def.shadowCss,
        tabId: tabId,
      })

      def.fn.call(undefined, pkg.api)
    }
  }

  private getTabId() {
    if (this.$.env.is.exFrame) return Number(this.$.env.params.tabId)
    if (!this.$.is.number(self.__epos.tabId)) throw this.never
    return self.__epos.tabId
  }
}
