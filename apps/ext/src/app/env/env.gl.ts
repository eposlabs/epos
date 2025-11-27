export class Env extends gl.Unit {
  params = this.getParams()
  url = new EnvUrl(this)
  is = new EnvIs(this)

  private getParams() {
    if (location.protocol !== 'chrome-extension:') return {}
    const url = new URL(location.href)
    return Object.fromEntries(url.searchParams)
  }
}

class EnvUrl extends gl.Unit {
  web = 'https://epos.dev'
  offscreen = '/offscreen.html?locus=background'

  system(params: { locus: 'permission' }) {
    return `/system.html?${new URLSearchParams(params)}`
  }

  view(params: { locus: 'popup' | 'sidePanel'; tabId: string }) {
    return `/view.html?${new URLSearchParams(params)}`
  }

  frame(params: {
    locus: 'popup' | 'sidePanel' | 'background'
    tabId?: string
    name: string
    hash: string
    dev: string
  }) {
    return `/frame.html?${new URLSearchParams(params)}`
  }
}

class EnvIs extends gl.Unit {
  private $env = this.closest(Env)!

  // Environment
  dev = import.meta.env.DEV
  prod = import.meta.env.PROD

  // Bundle
  cs = BUNDLE === 'cs'
  ex = BUNDLE === 'ex' || BUNDLE === 'ex-mini'
  os = BUNDLE === 'os'
  sm = BUNDLE === 'sm'
  sw = BUNDLE === 'sw'
  vw = BUNDLE === 'vw'

  // [cs] variations
  csTop = this.cs && self === top
  csFrame = this.cs && self !== top

  // [ex] variations by top/frame
  exTop = this.ex && self === top
  exFrame = this.ex && self !== top
  exFrameWeb = this.ex && !this.$env.params.locus
  exFrameExt = this.ex && !!this.$env.params.locus
  exFramePopup = this.ex && this.$env.params.locus === 'popup'
  exFrameSidePanel = this.ex && this.$env.params.locus === 'sidePanel'
  exFrameBackground = this.ex && this.$env.params.locus === 'background'

  // [vw] variations
  vwPopup = this.vw && this.$env.params.locus === 'popup'
  vwSidePanel = this.vw && this.$env.params.locus === 'sidePanel'
}
