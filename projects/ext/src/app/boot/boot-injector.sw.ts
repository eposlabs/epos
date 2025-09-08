import patchGlobalsJs from './boot-injector-patch-globals.sw?raw'

export type Target = { tabId: number; frameId: number; url: string }
export type JsInjectMode = 'function' | 'script' | 'script-auto-revoke'

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
      if (this.ignoredUrlPrefixes.some(prefix => url.startsWith(prefix))) return
      await this.safeInjectTo({ tabId, frameId, url })
    })
  }

  private async safeInjectTo(target: Target) {
    try {
      await this.injectTo(target)
    } catch (error) {
      this.log.error(error)
    }
  }

  private async injectTo(target: Target) {
    // Don't inject to frames
    if (target.frameId !== 0) return

    // Inject lite js
    const liteJs = this.$.pkgs.getLiteJs(target.url)
    if (liteJs) async: this.injectJs(target, liteJs, 'function')

    // Wait till [cs] is ready (creates self.__epos* variables and provides bus token)
    const csData = await this.waitCsReady(target)

    // Inject css
    const css = this.$.pkgs.getCss(target.url)
    if (css) async: this.injectCss(target, css)

    // Inject js
    const jsData = this.getJsData(target, csData.busToken)
    if (!jsData) return
    async: this.injectJs(target, jsData.js, jsData.dev ? 'script' : 'script-auto-revoke')
  }

  private async injectJs(target: Target, js: string, mode: JsInjectMode) {
    // Origin is CSP-protected? -> Skip
    const { origin } = new URL(target.url)
    if (this.cspProtectedOrigins.has(origin)) return

    // Inject js
    const result = await this.execute(target, 'MAIN', [js, mode], (js, mode) => {
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
        await this.fixCspError(target)
      } else {
        this.log.error(`Failed to inject js to ${target.url}.`, result.error)
      }
    }
  }

  private async injectCss(target: Target, css: string) {
    await this.execute(target, 'MAIN', [css], async css => {
      const blob = new Blob([css], { type: 'text/css' })
      const link = document.createElement('link')
      link.epos = true
      link.rel = 'stylesheet'
      link.href = URL.createObjectURL(blob)
      self.__eposElement.prepend(link)
    })
  }

  private async waitCsReady(target: Target) {
    return await this.execute(target, 'ISOLATED', [], async () => {
      self.__eposCsReady$ ??= Promise.withResolvers()
      return await self.__eposCsReady$.promise
    })
  }

  private getJsData(target: Target, busToken: string) {
    const payloads = this.$.pkgs.getPayloads(target.url)
    if (payloads.length === 0) return null

    const dev = payloads.some(payload => payload.dev)
    const ex = dev ? this.ex.dev : this.ex.prod
    const exJs = payloads.some(payload => this.hasReact(payload.script)) ? ex.full : ex.mini

    const js = [
      `(() => {`,
      `self.__eposTabId = ${JSON.stringify(target.tabId)}`,
      `self.__eposBusToken = ${JSON.stringify(busToken)}`,
      `self.__eposPkgDefs = [${payloads.map(payload => payload.script).join(',')}]`,
      patchGlobalsJs,
      exJs,
      `})()`,
    ].join(';\n')

    return { js, dev }
  }

  private async fixCspError(target: Target) {
    // First try? -> Unregister all service workers to drop cached headers (x.com)
    if (!this.cspFixTabIds.has(target.tabId)) {
      this.cspFixTabIds.add(target.tabId)
      self.setTimeout(() => this.cspFixTabIds.delete(target.tabId), 10_000)
      const origin = new URL(target.url).origin
      await this.$.browser.browsingData.remove({ origins: [origin] }, { serviceWorkers: true })
      await this.$.browser.tabs.reload(target.tabId)
    }

    // Already tried and still fails? -> Mark origin as CSP-protected.
    // This can happen if CSP is set via meta tag (web.telegram.org).
    else {
      const { origin } = new URL(target.url)
      this.cspFixTabIds.delete(target.tabId)
      this.cspProtectedOrigins.add(origin)
      this.log(`CSP-protected origin: ${origin}`)
    }
  }

  private async execute<T extends Fn>(target: Target, world: 'MAIN' | 'ISOLATED', args: unknown[], fn: T) {
    const [{ result }] = await this.$.browser.scripting.executeScript({
      target: { tabId: target.tabId },
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
