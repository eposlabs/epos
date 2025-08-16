export type Frame = string
export type TabId = number
export type Origin = 'exFrame' | 'exTab' | 'cs' | 'os' | 'sw' | 'vw'
export type ProxyChild = `exFrame-${Frame}` | 'exTab' | `cs-${TabId}`

export class Bus extends $gl.Unit {
  private origin = this.getOrigin()
  private utils = new $gl.BusUtils(this)
  private ext = new $gl.BusExt(this)
  private page = new $gl.BusPage(this)
  private data = new $gl.BusData(this)
  private actions = new $gl.BusActions(this)
  private proxy = new $gl.BusProxy(this)
  private api = new $gl.BusApi(this)

  on = this.$.bind(this.api, 'on')
  off = this.$.bind(this.api, 'off')
  once = this.$.bind(this.api, 'once')
  send = this.$.bind(this.api, 'send')
  emit = this.$.bind(this.api, 'emit')
  setSignal = this.$.bind(this.api, 'setSignal')
  waitSignal = this.$.bind(this.api, 'waitSignal')

  create(id: string) {
    return new $gl.BusApi(this, id)
  }

  getPageToken() {
    return this.page.getToken()
  }

  private is(...origins: Origin[]) {
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

  get internal() {
    return {
      actions: this.actions,
      data: this.data,
      ext: this.ext,
      is: this.is,
      origin: this.origin,
      page: this.page,
      proxy: this.proxy,
      utils: this.utils,
    }
  }
}
