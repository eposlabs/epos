// TODO: add timeout for waitForResponse (?)

import type { Frame, Origin } from './bus.gl'

const REQUEST = ':EPOS_BUS_REQUEST'
const RESPONSE = ':EPOS_BUS_RESPONSE'

export type Req = {
  type: typeof REQUEST
  id: string
  name: string
  args: unknown[]
  token: string | null
  frame: Frame | null
  origin: Subset<Origin, 'exFrame' | 'exTab' | 'cs' | 'os' | 'vw'>
}

export type Res = {
  type: typeof RESPONSE
  id: string
  result: unknown
}

export type Interceptor = (frame: Frame | null, ...args: any[]) => unknown

export class BusPage extends $gl.Unit {
  private $bus = this.up($gl.Bus, 'internal')!
  private frame = this.$bus.origin === 'exFrame' ? self.name : null
  private token: string | null = null
  private supported = this.$bus.is('exFrame', 'exTab', 'cs', 'os', 'vw')
  private interceptors: { [name: string]: Interceptor } = {}
  private static REQUEST = REQUEST
  private static RESPONSE = RESPONSE

  constructor(parent: $gl.Unit) {
    super(parent)
    if (!this.supported) return
    this.setupToken()
    this.setupMessageListener()
  }

  getToken() {
    return this.token
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
    if (this.$bus.is('cs')) {
      this.token = crypto.randomUUID()
    } else if (this.$bus.is('exTab')) {
      this.token = self.__epos.busToken
    }
  }

  private setupMessageListener() {
    window.addEventListener('message', async e => {
      const isReq = e.data?.type === REQUEST
      if (!isReq) return
      const req = e.data as Req

      if (req.origin === this.$bus.origin) return
      if (req.token !== this.token) throw new Error('Invalid token')

      const interceptor = this.interceptors[req.name]
      if (interceptor) {
        const result = await interceptor(req.frame, ...req.args)
        this.respond(req, result)
        return
      }

      let actions = this.$bus.actions.list.filter(a => a.name === req.name)
      if (req.origin === 'exFrame') {
        actions = actions.filter(h => h.proxy !== `exFrame-${req.frame}`)
      }

      const promises = actions.map(async a => a.fn.call(a.this, ...req.args))
      if (this.$bus.is('cs', 'os', 'vw')) {
        promises.push(this.$bus.ext.send(req.name, ...req.args))
      }

      const result = await this.$bus.utils.pick(promises)
      this.respond(req, result)
    })
  }

  private respond(req: Req, result: unknown) {
    const res = this.createRes(req.id, result)

    if (this.$bus.is('exFrame')) {
      window.parent.postMessage(res, '*')
    } else if (this.$bus.is('exTab', 'cs')) {
      window.postMessage(res, '*')
    } else if (this.$bus.is('os', 'vw')) {
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
      origin: this.$bus.origin as Req['origin'],
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
