import patchGlobalsJs from './boot-injector-patch-globals.sw?raw'

export type Tab = { id: number; url: string }
export type JsInjectMode = 'function' | 'script' | 'script-auto-revoke'
export type JsData = { js: string; dev: boolean }

export class BootInjector extends $sw.Unit {
  private cspFixTabIds = new Set<number>()
  private cspProtectedOrigins = new Set<string>()

  private ex = {
    dev: { full: '', mini: '' },
    prod: { full: '', mini: '' },
  }

  private ignoredUrlPrefixes = [
    'blob:',
    'chrome:',
    'devtools:',
    'about:blank',
    'chrome-extension:',
    'https://chromewebstore.google.com/',
  ]

  constructor(parent: $sw.Unit) {
    super(parent)
    this.injectOnNavigation()
    this.$.bus.on('boot.getJsData', this.getJsData, this)
  }

  async init() {
    // Dev versions are absent for exported packages
    const [exDev] = await this.$.utils.safe(fetch('/ex-dev.js').then(r => r.text()))
    const [exDevMini] = await this.$.utils.safe(fetch('/ex-dev-mini.js').then(r => r.text()))
    this.ex.dev.full = exDev ?? ''
    this.ex.dev.mini = exDevMini ?? ''

    // Prod versions are always present
    this.ex.prod.full = await fetch('/ex.js').then(r => r.text())
    this.ex.prod.mini = await fetch('/ex-mini.js').then(r => r.text())
  }

  private injectOnNavigation() {
    this.$.browser.webNavigation.onCommitted.addListener(async details => {
      const { tabId, frameId, url } = details
      // Do not inject to iframes on the page
      if (frameId !== 0) return
      if (this.ignoredUrlPrefixes.some(prefix => url.startsWith(prefix))) return
      await this.safeInjectTo({ id: tabId, url })
    })
  }

  private async safeInjectTo(tab: Tab) {
    try {
      await this.injectTo(tab)
    } catch (error) {
      this.log.error(error)
    }
  }

  private async injectTo(tab: Tab) {
    // Already injected? -> Done.
    // This prevents double injection caused by browser back/forward cache navigation.
    const injected = await this.execute(tab, 'MAIN', [], () => !!self.__eposInjected)
    if (injected) return

    // Inject lite js and injection flag
    const liteJs = this.$.pack.getLiteJs(tab.url)
    const injectionFlagJs = `self.__eposInjected = true;`
    async: this.injectJs(tab, `${injectionFlagJs}${liteJs}`, 'function')

    // Wait till [cs] is ready
    const csData = await this.waitCsReady(tab)

    // Inject css
    const css = this.$.pack.getCss(tab.url)
    if (css) async: this.injectCss(tab, css)

    // Inject ex.js + pkgs
    const jsData = this.getJsData(tab, csData.busToken)
    if (!jsData) return
    async: this.injectJs(tab, jsData.js, jsData.dev ? 'script' : 'script-auto-revoke')
  }

  private async injectJs(tab: Tab, js: string, mode: JsInjectMode) {
    // Origin is CSP-protected? -> Skip
    const { origin } = new URL(tab.url)
    if (this.cspProtectedOrigins.has(origin)) return

    // Inject js
    const result = await this.execute(tab, 'MAIN', [js, mode], (js, mode) => {
      try {
        if (mode === 'function') {
          new Function(js)()
        } else if (mode === 'script' || mode === 'script-auto-revoke') {
          const blob = new Blob([js], { type: 'application/javascript' })
          const url = URL.createObjectURL(blob)
          const script = document.createElement('script')
          script.epos = true
          script.src = url
          if (mode === 'script-auto-revoke') script.onload = () => URL.revokeObjectURL(url)
          self.__eposElement.prepend(script)
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
      } else if (result.error.includes('No tab with id')) {
        console.warn('caught-good')
        return
      } else {
        this.log.error(`Failed to inject js to ${tab.url}.`, result.error)
      }
    }
  }

  private async injectCss(tab: Tab, css: string) {
    await this.execute(tab, 'MAIN', [css], async css => {
      const blob = new Blob([css], { type: 'text/css' })
      const link = document.createElement('link')
      link.epos = true
      link.rel = 'stylesheet'
      link.href = URL.createObjectURL(blob)
      self.__eposElement.prepend(link)
    })
  }

  private async waitCsReady(tab: Tab) {
    return await this.execute(tab, 'ISOLATED', [], async () => {
      self.__eposCsReady$ ??= Promise.withResolvers()
      return await self.__eposCsReady$.promise
    })
  }

  private getJsData(tab: Tab, busToken: string, frame = false): JsData | null {
    const payloads = this.$.pack.getPayloads(tab.url, frame)
    if (payloads.length === 0) return null

    const dev = payloads.some(payload => payload.dev)
    const ex = dev ? this.ex.dev : this.ex.prod
    const exJs = payloads.some(payload => this.hasReact(payload.script)) ? ex.full : ex.mini

    const js = [
      `(() => {`,
      `self.__eposTabId = ${JSON.stringify(tab.id)}`,
      `self.__eposBusToken = ${JSON.stringify(busToken)}`,
      `self.__eposPkgDefs = [${payloads.map(payload => payload.script).join(',')}]`,
      patchGlobalsJs,
      exJs,
      `})()`,
    ].join(';\n')

    return { js, dev }
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

  private async execute<T extends Fn>(tab: Tab, world: 'MAIN' | 'ISOLATED', args: unknown[], fn: T) {
    const [{ result }] = await this.$.browser.scripting.executeScript({
      target: { tabId: tab.id },
      world: world,
      args: args,
      func: fn,
      injectImmediately: true,
    })

    return result as ReturnType<T>
  }

  private hasReact(js: string) {
    // TODO: probably React.createElement -> epos.libs.react
    return js.includes('epos.libs.reactJsxRuntime') || js.includes('React.createElement')
  }
}
