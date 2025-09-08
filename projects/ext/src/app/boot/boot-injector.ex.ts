import type { Payload } from '../pkgs/pkg/pkg.sw'

export class BootInjector extends $ex.Unit {
  async inject() {
    // For [exTab]:
    // - [cs] already injected globals + <epos/>
    // - [sw] already injected ex.js + pkgs
    if (this.$.env.is.exTab) {
      await this.executePkgs()
      return
    }

    // For [exFrameExt]:
    // - No need for globals patching
    // - Need to create <epos/> ([cs] is absent)
    // - Need to inject pkgs code ([sw] can't inject to frame.html)
    if (this.$.env.is.exFrameExt) {
      this.createEposElement()
      await this.injectCode()
      await this.executePkgs()
      return
    }

    // For [exFrameWeb]:
    // - Not implemented
    if (this.$.env.is.exFrameWeb) {
      this.log.error('exFrameWeb is not implemented')
      return
    }
  }

  private async createEposElement() {
    const element = document.createElement('epos')
    document.documentElement.prepend(element)
    self.__eposElement = element
  }

  private async injectCode() {
    // Inject lite js
    const liteJs = await this.$.bus.send<string>('pkgs.getLiteJs', location.href)
    if (liteJs) await this.injectJs(liteJs)

    // Inject css
    const css = await this.$.bus.send<string>('pkgs.getCss', location.href)
    if (css) this.injectCss(css)

    // Inject pkg payloads
    const payloads = await this.$.bus.send<Payload[]>('pkgs.getPayloads', location.href)
    if (payloads.length === 0) return
    const js = `self.__eposPkgDefs = [${payloads.map(payload => payload.script).join(',')}]`
    await this.injectJs(js)
  }

  private async injectJs(js: string) {
    const ready$ = Promise.withResolvers()
    const blob = new Blob([js], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    const script = document.createElement('script')
    script.epos = true
    script.src = url
    script.onload = () => ready$.resolve(true)
    self.__eposElement.prepend(script)
    await ready$.promise
    URL.revokeObjectURL(url)
  }

  private injectCss(css: string) {
    const blob = new Blob([css], { type: 'text/css' })
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.epos = true
    link.href = URL.createObjectURL(blob)
    self.__eposElement.prepend(link)
  }

  private async executePkgs() {
    const defs = self.__eposPkgDefs
    const tabId = this.getTabId()
    this.deleteEposVars()

    for (const def of defs) {
      // Create pkg
      const pkg = await this.$.pkgs.create({
        name: def.name,
        icon: def.icon,
        title: def.title,
        tabId: tabId,
        shadowCss: def.shadowCss,
      })

      // Execute def fn
      def.fn.call(undefined, pkg.api.epos)
    }
  }

  private getTabId() {
    if (this.$.env.is.exFrame) {
      if (this.$.env.is.exFrameExtBackground) return null
      if (this.$.env.is.exFrameExt) return Number(this.$.env.params.tabId)
      if (this.$.env.is.exFrameWeb) throw new Error('Not implemented')
    }

    if (this.$.env.is.exTab) {
      const tabId = self.__eposTabId
      if (!this.$.is.number(tabId)) throw this.never
      return tabId
    }

    throw this.never
  }

  private deleteEposVars() {
    Reflect.deleteProperty(self, '__eposIsTop')
    Reflect.deleteProperty(self, '__eposGlobals')
    Reflect.deleteProperty(self, '__eposElement')
    Reflect.deleteProperty(self, '__eposTabId')
    Reflect.deleteProperty(self, '__eposBusToken')
    Reflect.deleteProperty(self, '__eposPkgDefs')
    Reflect.deleteProperty(self, '__eposInjected')
  }
}
