/**
 * #### Extension Pages
 * - offscreen - `/offscreen.html`
 * - permissions - `/system.html/?type=permissions`
 * - popup view - `/view.html/?ref=popup&tabId={tabId}`
 * - panel view  - `/view.html/?ref=panel&tabId={tabId}`
 * - popup frame - `/frame.html/?ref=popup&name={pkgName}&tabId={tabId}`
 * - panel frame - `/frame.html/?ref=panel&name={pkgName}&tabId={tabId}`
 * - background frame - `/frame.html/?ref=background&name={pkgName}&tabId={tabId}`
 */
export class Env extends $gl.Unit {
  bundle = BUNDLE
  params = this.getParams()
  url = new EnvUrl(this)
  is = new EnvIs(this)

  isExtPage() {
    return location.protocol === 'chrome-extension:'
  }

  private getParams() {
    if (!this.isExtPage()) return {}
    const url = new URL(location.href)
    return Object.fromEntries(url.searchParams)
  }
}

class EnvUrl extends $gl.Unit {
  private $env = this.up(Env)!

  web = 'https://epos.dev'
  offscreen = '/offscreen.html'

  view(ref: 'popup' | 'panel' | 'permissions', tabId?: string | number) {
    const q = new URLSearchParams({ ref, ...(tabId && { tabId: String(tabId) }) })
    return `/view.html?${q}`
  }

  frame(name: string) {
    const ref = this.$env.is.os ? 'background' : this.$env.params.ref
    const tabId = this.$env.is.os ? null : this.$env.params.tabId
    const q = new URLSearchParams({ ref, name, ...(tabId && { tabId }) })
    return `/frame.html?${q}`
  }
}

class EnvIs extends $gl.Unit {
  private $env = this.up(Env)!

  // Environment
  dev = import.meta.env.DEV
  prod = import.meta.env.PROD

  // Bundle
  cs = this.$env.bundle === 'cs'
  ex = this.$env.bundle === 'ex'
  os = this.$env.bundle === 'os'
  sm = this.$env.bundle === 'sm'
  sw = this.$env.bundle === 'sw'
  vw = this.$env.bundle === 'vw'

  // Variations of vw
  vwPopup = this.vw && this.$env.params.ref === 'popup'
  vwPanel = this.vw && this.$env.params.ref === 'panel'
  vwShell = this.vwPopup || this.vwPanel
  vwPermissions = this.vw && this.$env.params.ref === 'permissions'

  // Variations of exTab
  exTabHub = this.ex && location.origin === this.$env.url.web
  exTabPage = this.ex && !this.exTabHub && !this.$env.isExtPage()
  exTab = this.exTabHub || this.exTabPage

  // Variations of exFrame
  exFrame = this.ex && !this.exTab
  exFramePopup = this.exFrame && this.$env.params.ref === 'popup'
  exFramePanel = this.exFrame && this.$env.params.ref === 'panel'
  exFrameBackground = this.exFrame && this.$env.params.ref === 'background'
}
