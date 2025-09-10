export const PAGE_REQUEST = ':EPOS_BUS_PAGE_REQUEST'
export const PAGE_RESPONSE = ':EPOS_BUS_PAGE_RESPONSE'

export type PageRequest = {
  type: typeof PAGE_REQUEST
  id: string
  name: string
  args: unknown[]
  busId: string
}

export type PageResponse = {
  type: typeof PAGE_RESPONSE
  reqId: string
  result: unknown
}

export class BusPageBridge extends $gl.Unit {
  private $bus = this.up($gl.Bus)!
  static PAGE_REQUEST = PAGE_REQUEST
  static PAGE_RESPONSE = PAGE_RESPONSE

  constructor(parent: $gl.Unit) {
    super(parent)

    if (this.$.env.is.csTab || this.$.env.is.vw || this.$.env.is.os) {
      this.setupHost()
    } else if (this.$.env.is.csFrame || this.$.env.is.ex) {
      this.setupFrame()
    }

    if (this.$.env.is.cs || this.$.env.is.vw || this.$.env.is.os) {
      this.watchForRemovedIframes()
    }
  }

  async sendToTop(name: string, ...args: unknown[]) {
    const req = this.createRequest(name, args)
    if (!self.top) throw this.never
    self.top.postMessage(req, '*')
    return await this.waitForResponse(req.id)
  }

  async sendToFrame(frame: WindowProxy, name: string, ...args: unknown[]) {
    const req = this.createRequest(name, args)
    frame.postMessage(req, { targetOrigin: '*' })
    return await this.waitForResponse(req.id)
  }

  private setupHost() {
    self.addEventListener('message', async e => {
      const req = e.data
      if (!this.isRequest(req)) return
      if (this.$bus.id == req.busId) return
      const frame = e.source as WindowProxy

      if (req.name === 'bus.registerFrameAction') {
        const [name] = req.args
        if (!this.$.is.string(name)) throw this.never
        const fn = (...args: unknown[]) => this.sendToFrame(frame, name, ...args)
        this.$bus.on(name, fn, undefined, frame)
        return
      }

      if (req.name === 'bus.unregisterFrameAction') {
        const [name] = req.args
        if (!this.$.is.string(name)) throw this.never
        this.$bus.off(name, undefined, frame)
        return
      }

      if (req.name === 'bus.unregisterAllFrameActions') {
        this.$bus.actions = this.$bus.actions.filter(action => action.target !== frame)
        return
      }

      if (req.name === 'bus.unregisterRemovedFrameActions') {
        this.unregisterRemovedFrameActions()
        return
      }

      const actions = this.$bus.actions.filter(action => action.name === req.name && action.target !== frame)

      const result = await this.$bus.utils.pick([
        ...actions.map(action => action.execute(...req.args)),
        this.$bus.extBridge.send(req.name, ...req.args),
      ])

      const res = this.createResponse(req.id, result)
      frame.postMessage(res, { targetOrigin: '*' })
    })
  }

  private setupFrame() {
    // Unregister all proxy actions left from previous frame's cs or ex
    if (this.$.env.is.csFrame) {
      async: this.sendToTop('bus.unregisterAllFrameActions')
    }

    self.addEventListener('message', async e => {
      const req = e.data
      if (!this.isRequest(req)) return
      if (this.$bus.id == req.busId) return

      const actions = this.$bus.actions.filter(action => action.name === req.name)
      if (actions.length === 0) return

      const result = await this.$bus.utils.pick(actions.map(action => action.execute(...req.args)))
      const res = this.createResponse(req.id, result)
      if (!self.top) throw this.never
      self.top.postMessage(res, '*')
    })
  }

  private async waitForResponse(reqId: string, maxWaitTime = 10_000) {
    const result$ = Promise.withResolvers()

    // Setup timeout
    const timeout = self.setTimeout(() => {
      result$.resolve(null)
      self.removeEventListener('message', onMessage)
    }, maxWaitTime)

    // Wait for response message
    const onMessage = (e: MessageEvent) => {
      const res = e.data
      if (!this.isResponse(res)) return
      if (res.reqId !== reqId) return
      self.clearTimeout(timeout)
      self.removeEventListener('message', onMessage)
      result$.resolve(res.result)
    }
    self.addEventListener('message', onMessage)

    return await result$.promise
  }

  private createRequest(name: string, args: unknown[]): PageRequest {
    return {
      type: PAGE_REQUEST,
      id: this.$.utils.id(),
      name: name,
      args: this.$bus.serializer.sanitize(args) as unknown[],
      busId: this.$bus.id,
    }
  }

  private createResponse(reqId: string, result: unknown): PageResponse {
    return {
      type: PAGE_RESPONSE,
      reqId: reqId,
      result: this.$bus.serializer.sanitize(result),
    }
  }

  private isRequest(message: unknown): message is PageRequest {
    if (!this.$.is.object(message)) return false
    return message.type === PAGE_REQUEST
  }

  private isResponse(message: unknown): message is PageResponse {
    if (!this.$.is.object(message)) return false
    return message.type === PAGE_RESPONSE
  }

  private watchForRemovedIframes() {
    const isElementNode = (node: Node): node is Element => node.nodeType === Node.ELEMENT_NODE
    new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.removedNodes) {
          if (!isElementNode(node)) continue
          const containsIframe = node instanceof HTMLIFrameElement || !!node.querySelector('iframe')
          if (!containsIframe) continue
          if (this.$.env.is.csFrame) {
            this.sendToTop('bus.unregisterRemovedFrameActions')
          } else {
            this.unregisterRemovedFrameActions()
          }
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true })
  }

  private unregisterRemovedFrameActions() {
    const frames = new Set(this.getAllFrames())
    this.$bus.actions = this.$bus.actions.filter(action => {
      if (!action.target) return true
      return frames.has(action.target as WindowProxy)
    })
  }

  private getAllFrames(root: WindowProxy = self): WindowProxy[] {
    const frames: WindowProxy[] = []
    for (let i = 0; i < root.frames.length; i++) {
      const frame = root.frames[i]
      const subframes = this.getAllFrames(frame)
      frames.push(frame, ...subframes)
    }
    return frames
  }
}
