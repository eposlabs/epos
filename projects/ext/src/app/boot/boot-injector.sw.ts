import globals from './boot-injector-globals.sw?raw'

export type Tab = { id: number; url: string }
export type JsInjectMode = 'script' | 'function'

export class BootInjector extends $sw.Unit {
  private cspFixTabIds = new Set<number>()
  private cspProtectedOrigins = new Set<string>()
  private engine = { full: '', mini: '' }
  private globals: string

  constructor(parent: $sw.Unit) {
    super(parent)
    this.globals = globals
    this.injectToTabsOnNavigation()
  }

  async init() {
    this.engine.full = await fetch('/ex.js').then(r => r.text())
    this.engine.mini = await fetch('/ex-mini.js').then(r => r.text())
  }

  private injectToTabsOnNavigation() {
    this.$.browser.webNavigation.onCommitted.addListener(async details => {
      const { tabId, frameId, url } = details
      const isMainFrame = frameId === 0
      if (!isMainFrame) return
      if (url.startsWith('blob:')) return
      if (url.startsWith('chrome:')) return
      if (url.startsWith('devtools:')) return
      if (url.startsWith('about:blank')) return
      if (url.startsWith('chrome-extension:')) return
      if (url.startsWith('https://chromewebstore.google.com/')) return
      await this.safeInjectToTab({ id: tabId, url })
    })
  }

  private async safeInjectToTab(tab: Tab) {
    try {
      await this.injectToTab(tab)
    } catch (error) {
      this.log.error(error)
    }
  }

  private async injectToTab(tab: Tab) {
    // Inject lite js asap
    const liteJs = this.$.pkgs.getLiteJs(tab.url)
    if (liteJs) async: this.injectJs(tab, liteJs, 'function')

    // Wait till CS is ready (creates self.__epos and generates bus token)
    const csData = await this.waitCsReady(tab)

    // Inject css
    const css = this.$.pkgs.getCss(tab.url)
    if (css) async: this.injectCss(tab, css)

    // No pkg defs for the url? -> Done
    const defs = this.$.pkgs.getDefs(tab.url)
    if (defs.length === 0) return

    // Prepare js
    const engine = defs.some(def => this.hasReact(def)) ? this.engine.full : this.engine.mini
    const js = [
      `(() => {`,
      `self.__epos.tabId = ${JSON.stringify(tab.id)}`,
      `self.__epos.busToken = ${JSON.stringify(csData.busToken)}`,
      `self.__epos.defs = [${defs.join(',')}]`,
      this.globals,
      engine,
      `})()`,
    ].join(';\n')

    // Inject js
    async: this.injectJs(tab, js, 'script')
  }

  private async injectJs(tab: Tab, js: string, mode: JsInjectMode) {
    // Origin is CSP-protected? -> Skip
    const { origin } = new URL(tab.url)
    if (this.cspProtectedOrigins.has(origin)) return

    // Inject js
    const result = await this.execute(tab.id, 'MAIN', [js, mode], (js, mode) => {
      try {
        if (mode === 'script') {
          const blob = new Blob([js], { type: 'application/javascript' })
          const url = URL.createObjectURL(blob)
          const script = document.createElement('script')
          script.epos = true
          script.src = url
          script.onload = () => URL.revokeObjectURL(url)
          self.__epos.element.prepend(script)
        } else if (mode === 'function') {
          new Function(js)()
        }
        return { error: null }
      } catch (e) {
        console.error(e)
        const error = e instanceof Error ? e.message : String(e)
        return { error }
      }
    })

    // Handle errors
    if (result.error) {
      if (result.error.includes('Content Security Policy')) {
        await this.fixCspError(tab)
      } else {
        this.log.error(`Failed to inject js to ${tab.url}.`, result.error)
      }
    }
  }

  private async injectCss(tab: Tab, css: string) {
    await this.execute(tab.id, 'MAIN', [css], async css => {
      const blob = new Blob([css], { type: 'text/css' })
      const link = document.createElement('link')
      link.epos = true
      link.rel = 'stylesheet'
      link.href = URL.createObjectURL(blob)
      self.__epos.element.prepend(link)
    })
  }

  private async waitCsReady(tab: Tab) {
    return await this.execute(tab.id, 'ISOLATED', [], async () => {
      self.__eposCsReady$ ??= Promise.withResolvers()
      return await self.__eposCsReady$.promise
    })
  }

  private async fixCspError(tab: Tab) {
    // First try? -> Unregister all service workers to drop cached headers (x.com)
    if (!this.cspFixTabIds.has(tab.id)) {
      this.cspFixTabIds.add(tab.id)
      self.setTimeout(() => this.cspFixTabIds.delete(tab.id), 10_000)
      const origin = new URL(tab.url).origin
      await this.$.browser.browsingData.remove({ origins: [origin] }, { serviceWorkers: true })
      await this.$.browser.tabs.reload(tab.id)
    }

    // Already tried and still fails? -> Mark origin as CSP-protected.
    // This can happen if CSP is set via meta tag (web.telegram.org).
    else {
      const { origin } = new URL(tab.url)
      this.cspFixTabIds.delete(tab.id)
      this.cspProtectedOrigins.add(origin)
      this.log(`CSP-protected origin: ${origin}`)
    }
  }

  private async execute<T extends Fn>(tabId: number, world: 'MAIN' | 'ISOLATED', args: unknown[], fn: T) {
    const [{ result }] = await this.$.browser.scripting.executeScript({
      target: { tabId },
      world: world,
      args: args,
      func: fn,
      injectImmediately: true,
    })

    return result as ReturnType<T>
  }

  private hasReact(js: string) {
    return js.includes('epos.reactJsxRuntime') || js.includes('React.createElement')
  }
}
