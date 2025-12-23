export class EnvIs extends gl.Unit {
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

  // `cs` variations
  csTop = this.cs && self === top
  csFrame = this.cs && self !== top

  // `ex` variations
  exTop = this.ex && self === top
  exFrame = this.ex && self !== top
  exExtension = this.ex && location.protocol === 'chrome-extension:'

  // `vw` variations
  vwPopup = this.vw && new URLSearchParams(location.search).get('locus') === 'popup'
  vwSidePanel = this.vw && new URLSearchParams(location.search).get('locus') === 'sidePanel'
}
