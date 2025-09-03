/**
 * #### Extension Pages
 * - offscreen - `/offscreen.html`
 * - permission - `/system.html/?type=permission`
 * - popup view - `/view.html/?type=popup&tabId={tabId}`
 * - panel view  - `/view.html/?type=panel&tabId={tabId}`
 * - popup frame - `/frame.html/?type=popup&name={pkgName}&tabId={tabId}`
 * - panel frame - `/frame.html/?type=panel&name={pkgName}&tabId={tabId}`
 * - background frame - `/frame.html/?type=background&name={pkgName}&tabId={tabId}`
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

  view(type: 'popup' | 'panel', tabId?: string | number) {
    const q = new URLSearchParams({ type, ...(tabId && { tabId: String(tabId) }) })
    return `/view.html?${q}`
  }

  frame(name: string) {
    const type = this.$env.is.os ? 'background' : this.$env.params.type
    const tabId = this.$env.is.os ? null : this.$env.params.tabId
    const q = new URLSearchParams({ type, name, ...(tabId && { tabId }) })
    return `/frame.html?${q}`
  }

  system(type: 'permission') {
    const q = new URLSearchParams({ type })
    return `/system.html?${q}`
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
  vwPopup = this.vw && this.$env.params.type === 'popup'
  vwPanel = this.vw && this.$env.params.type === 'panel'

  // Variations of exTab
  exTabHub = this.ex && location.origin === this.$env.url.web
  exTabPage = this.ex && !this.exTabHub && !this.$env.isExtPage()
  exTab = this.exTabHub || this.exTabPage

  // Variations of exFrame
  exFrame = this.ex && !this.exTab
  exFramePopup = this.exFrame && this.$env.params.type === 'popup'
  exFramePanel = this.exFrame && this.$env.params.type === 'panel'
  exFrameBackground = this.exFrame && this.$env.params.type === 'background'
}
