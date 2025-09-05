import type { TabId } from './bus.gl'

const REQUEST = ':EPOS_BUS_REQUEST'

export type Req = {
  type: typeof REQUEST
  name: string
  argsJson: string
  locus: 'service-worker' | 'content-script' | 'ext-page'
}

export type Interceptor = (sender: chrome.runtime.MessageSender, ...args: any[]) => unknown

export class BusExt extends $gl.Unit {
  private $bus = this.up($gl.Bus)!
  private supported = this.$bus.is('service-worker', 'content-script', 'ext-page')
  private interceptors: { [name: string]: Interceptor } = {}
  static REQUEST = REQUEST

  constructor(parent: $gl.Unit) {
    super(parent)
    if (!this.supported) return
    this.setupMessageListener()
  }

  intercept(name: string, fn: Interceptor) {
    this.interceptors[name] = fn
  }

  async send(name: string, ...args: unknown[]) {
    const req = this.createReq(name, args)

    try {
      const result = await this.$.browser.runtime.sendMessage(req)
      if (result === undefined) return null // no handlers
      if (!this.$.is.string(result)) throw this.never
      return await this.$bus.data.deserialize(result)
    } catch (e) {
      if (this.isIgnoredError(e)) return null
      throw e
    }
  }

  async sendToTab(tabId: TabId, name: string, ...args: unknown[]) {
    const req = this.createReq(name, args)

    try {
      const result = await this.$.browser.tabs.sendMessage(tabId, req)
      if (result === undefined) return null // no handlers
      if (!this.$.is.string(result)) throw this.never
      return await this.$bus.data.deserialize(result)
    } catch (e) {
      if (this.isIgnoredError(e)) return null
      throw e
    }
  }

  private setupMessageListener() {
    this.$.browser.runtime.onMessage.addListener((message, sender, respond) => {
      const isReq = message?.type === REQUEST
      if (!isReq) return
      const req = message as Req

      const interceptor = this.interceptors[req.name] ?? null
      if (interceptor) {
        async: (async () => {
          const args = await this.$bus.data.deserialize(req.argsJson)
          if (!this.$.is.array(args)) throw this.never
          const result = await interceptor(sender, ...args)
          const resultJson = this.$bus.data.serialize(result)
          respond(resultJson)
        })()
        return true
      }

      let actions = this.$bus.actions.list.filter(a => a.name === req.name)

      if (req.locus === 'content-script') {
        const tabId = sender.tab?.id
        if (!tabId) throw this.never
        actions = actions.filter(a => a.proxy !== `content-script-${tabId}`)
      }

      if (actions.length > 0) {
        async: (async () => {
          const args = await this.$bus.data.deserialize(req.argsJson)
          if (!this.$.is.array(args)) throw this.never
          const promises = actions.map(async action => action.fn.call(action.this, ...args))
          const result = await this.$bus.utils.pick(promises)
          const resultJson = this.$bus.data.serialize(result)
          respond(resultJson)
        })()

        return true
      }
    })
  }

  private createReq(name: string, args: unknown[]): Req {
    return {
      type: REQUEST,
      name: name,
      argsJson: this.$bus.data.serialize(args),
      locus: this.$bus.locus as Req['locus'],
    }
  }

  private isIgnoredError(e: unknown): boolean {
    if (!(e instanceof Error)) return false
    return (
      e.message.includes('Receiving end does not exist.') ||
      e.message.includes('Extension context invalidated.')
    )
  }
}
