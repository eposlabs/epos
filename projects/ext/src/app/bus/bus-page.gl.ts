// TODO: add timeout for waitForResponse (?)

import type { Frame } from './bus.gl'

const REQUEST = ':EPOS_BUS_REQUEST'
const RESPONSE = ':EPOS_BUS_RESPONSE'

export type Req = {
  type: typeof REQUEST
  id: string
  name: string
  args: unknown[]
  token: string | null
  frame: Frame | null
  locus: 'content-script' | 'ext-page' | 'ext-frame' | 'injection'
}

export type Res = {
  type: typeof RESPONSE
  id: string
  result: unknown
}

export type Interceptor = (frame: Frame | null, ...args: any[]) => unknown

export class BusPage extends $gl.Unit {
  /** Requires for secure [injection] <-> [content-script] communication */
  token: string | null = null

  private $bus = this.up($gl.Bus)!
  private frame = this.$bus.locus === 'ext-frame' ? self.name : null
  private supported = this.$bus.is('content-script', 'ext-page', 'ext-frame', 'injection')
  private interceptors: { [name: string]: Interceptor } = {}
  static REQUEST = REQUEST
  static RESPONSE = RESPONSE

  constructor(parent: $gl.Unit) {
    super(parent)
    if (!this.supported) return
    this.setupToken()
    this.setupMessageListener()
  }

  intercept(name: string, fn: Interceptor) {
    this.interceptors[name] = fn
  }

  async send(name: string, ...args: unknown[]) {
    const req = this.createReq(name, args)
    window.postMessage(req, '*')
    return await this.waitForResponse(req.id)
  }

  async sendToParent(name: string, ...args: unknown[]) {
    const req = this.createReq(name, args)
    window.parent.postMessage(req, '*')
    return await this.waitForResponse(req.id)
  }

  async sendToFrame(frame: Frame, name: string, ...args: unknown[]) {
    const iframe = document.querySelector<HTMLIFrameElement>(`iframe[name="${frame}"]`)
    if (!iframe) return null
    if (!iframe.contentWindow) throw this.never

    const req = this.createReq(name, args)
    iframe.contentWindow.postMessage(req, '*')
    return await this.waitForResponse(req.id)
  }

  private async waitForResponse(reqId: string) {
    const result$ = Promise.withResolvers()

    const onMessage = (e: MessageEvent) => {
      const isRes = e.data?.type === RESPONSE
      if (!isRes) return
      const res = e.data as Res
      if (res.id !== reqId) return
      window.removeEventListener('message', onMessage)
      result$.resolve(res.result)
    }

    window.addEventListener('message', onMessage)

    return await result$.promise
  }

  private setupToken() {
    if (this.$bus.is('content-script')) {
      this.token = crypto.randomUUID()
    } else if (this.$bus.is('injection')) {
      this.token = self.__eposBusToken
    } else {
      this.token = null
    }
  }

  private setupMessageListener() {
    window.addEventListener('message', async e => {
      const isReq = e.data?.type === REQUEST
      if (!isReq) return
      const req = e.data as Req

      if (req.locus === this.$bus.locus) return
      if (this.token !== req.token) throw new Error('Invalid token')

      const interceptor = this.interceptors[req.name]
      if (interceptor) {
        const result = await interceptor(req.frame, ...req.args)
        this.respond(req, result)
        return
      }

      let actions = this.$bus.actions.list.filter(action => action.name === req.name)

      if (req.locus === 'injection') {
        actions = actions.filter(action => action.proxy !== 'injection')
      }

      if (req.locus === 'ext-frame') {
        actions = actions.filter(action => action.proxy !== `ext-frame-${req.frame}`)
      }

      const promises = actions.map(async action => action.fn.call(action.this, ...req.args))
      if (this.$bus.is('content-script', 'ext-page')) {
        promises.push(this.$bus.ext.send(req.name, ...req.args))
      }

      const result = await this.$bus.utils.pick(promises)
      this.respond(req, result)
    })
  }

  private respond(req: Req, result: unknown) {
    const res = this.createRes(req.id, result)

    if (this.$bus.is('ext-frame')) {
      window.parent.postMessage(res, '*')
    } else if (this.$bus.is('injection', 'content-script')) {
      window.postMessage(res, '*')
    } else if (this.$bus.is('ext-page')) {
      const selector = `iframe[name="${req.frame}"]`
      const iframe = document.querySelector<HTMLIFrameElement>(selector)
      if (!iframe) return
      if (!iframe.contentWindow) throw this.never
      iframe.contentWindow.postMessage(res, '*')
    } else {
      throw this.never
    }
  }

  private createReq(name: string, args: unknown[]): Req {
    return {
      type: REQUEST,
      id: this.$bus.utils.id(),
      name: name,
      args: this.$bus.data.sanitize(args) as unknown[],
      token: this.token,
      frame: this.frame,
      locus: this.$bus.locus as Req['locus'],
    }
  }

  private createRes(id: string, result: unknown): Res {
    return {
      type: RESPONSE,
      id: id,
      result: this.$bus.data.sanitize(result),
    }
  }
}
