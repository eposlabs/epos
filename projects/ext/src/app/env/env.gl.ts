export class Env extends $gl.Unit {
  params = this.getParams()
  url = new EnvUrl(this)
  is = new EnvIs(this)

  private getParams() {
    if (location.protocol !== 'chrome-extension:') return {}
    const url = new URL(location.href)
    return Object.fromEntries(url.searchParams)
  }
}

class EnvUrl extends $gl.Unit {
  web = 'https://epos.dev'
  offscreen = '/offscreen.html?type=background'

  system(params: { type: 'permission' }) {
    return `/system.html?${new URLSearchParams(params)}`
  }

  view(params: { type: 'popup' | 'panel'; tabId: string }) {
    return `/view.html?${new URLSearchParams(params)}`
  }

  frame(params: {
    type: 'popup' | 'panel' | 'background'
    tabId?: string
    name: string
    hash: string
    dev: string
  }) {
    return `/frame.html?${new URLSearchParams(params)}`
  }
}

class EnvIs extends $gl.Unit {
  private $env = this.up(Env)!

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

  // cs variations
  csTab = this.cs && self === top
  csFrame = this.cs && self !== top

  // ex variations
  exTab = this.ex && self === top
  exFrame = this.ex && self !== top
  exFrameExtPopup = this.exFrame && this.$env.params.type === 'popup'
  exFrameExtPanel = this.exFrame && this.$env.params.type === 'panel'
  exFrameExtBackground = this.exFrame && this.$env.params.type === 'background'
  exFrameExt = this.exFrameExtPopup || this.exFrameExtPanel || this.exFrameExtBackground
  exFrameWeb = this.exFrame && !this.exFrameExtPopup && !this.exFrameExtPanel && !this.exFrameExtBackground

  // vw variations
  vwPopup = this.vw && this.$env.params.type === 'popup'
  vwPanel = this.vw && this.$env.params.type === 'panel'
}
