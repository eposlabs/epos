const EPOS_DEV_WS = import.meta.env.EPOS_DEV_WS
const EPOS_DEV_HUB = import.meta.env.EPOS_DEV_HUB
const EPOS_PROD_HUB = import.meta.env.EPOS_PROD_HUB

export type Bundle = 'ex' | 'cs' | 'os' | 'vw' | 'sw'

/**
 * #### Extension Pages
 * - offscreen - `/offscreen.html?ref=background`
 * - popup view - `/view.html/?ref=popup&tabId={tabId}`
 * - panel view  - `/view.html/?ref=panel&tabId={tabId}`
 * - permissions view - `/view.html/?ref=permissions`
 * - popup frame - `/frame.html/?ref=popup&tabId={tabId}&pkgName={pkgName}`
 * - panel frame - `/frame.html/?ref=panel&tabId={tabId}&pkgName={pkgName}`
 * - background frame - `/frame.html/?ref=background&tabId={tabId}&pkgName={pkgName}`
 */
export class Env extends $gl.Unit {
  bundle = BUNDLE
  params = this.getParams()
  url = new EnvUrl(this)
  is = new EnvIs(this)

  private isExtPage() {
    return location.protocol === 'chrome-extension:'
  }

  private getParams() {
    if (!this.isExtPage()) return {}
    const url = new URL(location.href)
    return Object.fromEntries(url.searchParams)
  }

  get internal() {
    return {
      bundle: this.bundle,
      isExtPage: this.isExtPage,
      params: this.params,
      url: this.url,
    }
  }
}

class EnvUrl extends $gl.Unit {
  private $env = this.up(Env, 'internal')!

  ws() {
    return EPOS_DEV_WS
  }

  hub(dev = false) {
    return dev ? EPOS_DEV_HUB : EPOS_PROD_HUB
  }

  view(ref: 'popup' | 'panel' | 'permissions', tabId?: string | number) {
    const q = new URLSearchParams({ ref, ...(tabId && { tabId: String(tabId) }) })
    return `/view.html?${q}`
  }

  frame(pkgName: string) {
    const { ref, tabId } = this.$env.params
    const q = new URLSearchParams({ ref, pkgName, ...(tabId && { tabId }) })
    return `/frame.html?${q}`
  }

  offscreen() {
    const q = new URLSearchParams({ ref: 'background' })
    return `/offscreen.html?${q}`
  }
}

class EnvIs extends $gl.Unit {
  private $env = this.up(Env, 'internal')!

  // Environment
  dev = import.meta.env.DEV
  prod = import.meta.env.PROD

  // Bundle
  cs = this.$env.bundle === 'cs'
  ex = this.$env.bundle === 'ex'
  os = this.$env.bundle === 'os'
  sw = this.$env.bundle === 'sw'
  vw = this.$env.bundle === 'vw'

  // Variations of vw
  vwPopup = this.vw && this.$env.params.ref === 'popup'
  vwPanel = this.vw && this.$env.params.ref === 'panel'
  vwShell = this.vwPopup || this.vwPanel
  vwPermissions = this.vw && this.$env.params.ref === 'permissions'

  // Variations of exTab
  exTabHubDev = this.ex && location.origin === EPOS_DEV_HUB
  exTabHubProd = this.ex && location.origin === EPOS_PROD_HUB
  exTabHub = this.exTabHubDev || this.exTabHubProd
  exTabPage = this.ex && !this.exTabHub && !this.$env.isExtPage()
  exTab = this.exTabHub || this.exTabPage

  // Variations of exFrame
  exFrame = this.ex && !this.exTab
  exFramePopup = this.exFrame && this.$env.params.ref === 'popup'
  exFramePanel = this.exFrame && this.$env.params.ref === 'panel'
  exFrameBackground = this.exFrame && this.$env.params.ref === 'background'
}
