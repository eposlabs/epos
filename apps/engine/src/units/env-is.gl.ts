export class EnvIs extends gl.Unit {
  // Environment
  dev = DEV
  prod = PROD

  // Bundle
  cs = BUNDLE === 'cs'
  ex = BUNDLE === 'ex'
  os = BUNDLE === 'os'
  pm = BUNDLE === 'pm'
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
