export type Frame = string
export type TabId = number
export type Origin = 'exFrame' | 'exTab' | 'cs' | 'os' | 'sw' | 'vw'
export type ProxyChild = `exFrame-${Frame}` | 'exTab' | `cs-${TabId}`

export class Bus extends $gl.Unit {
  origin = this.getOrigin()
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

  is(...origins: Origin[]) {
    return origins.includes(this.origin)
  }

  private getOrigin(): Origin {
    if (this.$.env.is.exTab) return 'exTab'
    if (this.$.env.is.exFrame) return 'exFrame'
    if (this.$.env.is.cs) return 'cs'
    if (this.$.env.is.os) return 'os'
    if (this.$.env.is.sw) return 'sw'
    if (this.$.env.is.vw) return 'vw'
    throw this.never
  }
}
