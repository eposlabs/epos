export type Frame = string
export type TabId = number
export type Locus = 'service-worker' | 'content-script' | 'ext-page' | 'ext-frame' | 'injection'
export type ProxyChild = `content-script-${TabId}` | `ext-frame-${Frame}` | 'injection'

export class Bus extends $gl.Unit {
  locus = this.getLocus()
  utils = new $gl.BusUtils(this)
  ext = new $gl.BusExt(this)
  page = new $gl.BusPage(this)
  data = new $gl.BusData(this)
  actions = new $gl.BusActions(this)
  proxy = new $gl.BusProxy(this)
  api = new $gl.BusApi(this)

  on = this.$.utils.link(this.api, 'on')
  off = this.$.utils.link(this.api, 'off')
  once = this.$.utils.link(this.api, 'once')
  send = this.$.utils.link(this.api, 'send')
  emit = this.$.utils.link(this.api, 'emit')
  setSignal = this.$.utils.link(this.api, 'setSignal')
  waitSignal = this.$.utils.link(this.api, 'waitSignal')

  create(id: string) {
    return new $gl.BusApi(this, id)
  }

  getPageToken() {
    return this.page.getToken()
  }

  is(...loci: Locus[]) {
    return loci.includes(this.locus)
  }

  private getLocus(): Locus {
    if (this.$.env.is.sw) return 'service-worker'
    if (this.$.env.is.cs) return 'content-script'
    if (this.$.env.is.exTab) return 'injection'
    if (this.$.env.is.exFrame) return 'ext-frame'
    if (this.$.env.is.os || this.$.env.is.vw || this.$.env.is.sm) return 'ext-page'
    throw this.never
  }
}
