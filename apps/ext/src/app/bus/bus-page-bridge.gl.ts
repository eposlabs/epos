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

export class BusPageBridge extends gl.Unit {
  private $bus = this.up(gl.Bus)!
  static PAGE_REQUEST = PAGE_REQUEST
  static PAGE_RESPONSE = PAGE_RESPONSE
  private removedTargetListeners = new Set<(target: WindowProxy) => void>()

  constructor(parent: gl.Unit) {
    super(parent)

    if (this.$.env.is.csTop || this.$.env.is.os || this.$.env.is.vw) {
      this.setupCsTopOsVw()
    } else if (this.$.env.is.csFrame || this.$.env.is.ex) {
      this.setupCsFrameEx()
    }

    // [csTop], [csFrame], [vw] and [os] should watch for removed iframes to unregister related actions
    if (this.$.env.is.csTop || this.$.env.is.csFrame || this.$.env.is.vw || this.$.env.is.os) {
      this.watchForRemovedIframes()
    }
  }

  async sendToTop(name: string, ...args: unknown[]) {
    if (!self.top) throw this.never
    return await this.sendTo(self.top, name, ...args)
  }

  private async sendTo(target: WindowProxy, name: string, ...args: unknown[]) {
    const req = this.createRequest(name, args)
    target.postMessage(req, '*')
    return await this.waitForResponse(req.id, target)
  }

  private setupCsTopOsVw() {
    // Listen for messages from [csFrame] and [ex].
    // We listen on self === top, so only top messages are handled.
    self.addEventListener('message', async e => {
      const req = e.data
      if (!this.isRequest(req)) return
      if (this.$bus.id == req.busId) return
      const source = e.source as WindowProxy | null
      if (!source) return

      // Register proxy action for [csFrame] and [ex]
      if (req.name === 'bus.registerProxyAction') {
        const [name] = req.args
        if (!this.$.utils.is.string(name)) throw this.never
        const fn = (...args: unknown[]) => this.sendTo(source, name, ...args)
        this.$bus.on(name, fn, undefined, source)
        return
      }

      // Unregister proxy action for [csFrame] and [ex]
      if (req.name === 'bus.unregisterProxyAction') {
        const [name] = req.args
        if (!this.$.utils.is.string(name)) throw this.never
        this.$bus.off(name, undefined, source)
        return
      }

      // Clear proxy actions for source frame
      if (req.name === 'bus.clearFrameProxyActions') {
        this.removedTargetListeners.forEach(fn => fn(source))
        this.$bus.actions = this.$bus.actions.filter(action => action.target !== source)
        return
      }

      // Remove all proxy actions whose targets no longer exist
      if (req.name === 'bus.cleanupProxyActions') {
        this.cleanupProxyActions()
        return
      }

      const actions = this.$bus.actions.filter(action => action.name === req.name && action.target !== source)

      const result = await this.$bus.utils.pick([
        ...actions.map(action => action.execute(...req.args)),
        this.$bus.extBridge.send(req.name, ...req.args),
      ])

      const res = this.createResponse(req.id, result)
      source.postMessage(res, '*')
    })
  }

  private setupCsFrameEx() {
    // Remove all proxy actions left from the previous [csFrame] and [exFrame].
    // This happens on iframe refresh or page navigation inside iframe.
    // [csFrame] and [exFrame] run in the same WindowProxy, but we call for both, because for <background>
    // frames we have [exFrame] only and for web frames, [exFrame] can be absent.
    async: this.sendToTop('bus.clearFrameProxyActions')

    // Listen for messages from [csTop], [vw] and [os].
    // We listen on self, so only targeted messages are handled.
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

  private async waitForResponse(reqId: string, target: WindowProxy) {
    const result$ = Promise.withResolvers()

    // Wait for response message
    const onMessage = (e: MessageEvent) => {
      const res = e.data
      if (!this.isResponse(res)) return
      if (res.reqId !== reqId) return
      result$.resolve(res.result)
    }
    self.addEventListener('message', onMessage)

    // Target removed? -> Resolve with null
    const onRemovedTarget = (removedTarget: WindowProxy) => {
      if (removedTarget !== target) return
      result$.resolve(null)
    }
    this.removedTargetListeners.add(onRemovedTarget)

    // Wait limit reached? -> Resolve with null
    const timeout = self.setTimeout(() => {
      result$.resolve(null)
    }, 10_000)

    // Wait for result
    const result = await result$.promise

    // Cleanup
    self.clearTimeout(timeout)
    self.removeEventListener('message', onMessage)
    this.removedTargetListeners.delete(onRemovedTarget)

    return result
  }

  private watchForRemovedIframes() {
    const isElementNode = (node: Node): node is Element => node.nodeType === Node.ELEMENT_NODE

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.removedNodes) {
          if (!isElementNode(node)) continue
          const containsIframe = node instanceof HTMLIFrameElement || !!node.querySelector('iframe')
          if (!containsIframe) continue
          if (this.$.env.is.csFrame) {
            this.sendToTop('bus.cleanupProxyActions')
          } else {
            this.cleanupProxyActions()
          }
        }
      }
    })

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })
  }

  /** Remove all proxy actions whose targets no longer exist. */
  private cleanupProxyActions() {
    const existingTargets = new Set<WindowProxy>([self, ...this.getPageFrames()])

    this.$bus.actions = this.$bus.actions.filter(action => {
      // No target? -> Keep action
      if (!action.target) return true

      // Target exists? -> Keep action
      const target = action.target as WindowProxy
      if (existingTargets.has(target)) return true

      // Target does not exist? -> Remove action and notify listeners
      this.removedTargetListeners.forEach(fn => fn(target))
      return false
    })
  }

  private getPageFrames(root: WindowProxy = self): WindowProxy[] {
    const frames: WindowProxy[] = []
    for (let i = 0; i < root.frames.length; i++) {
      const frame = root.frames[i]
      const subframes = this.getPageFrames(frame)
      frames.push(frame, ...subframes)
    }
    return frames
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
    if (!this.$.utils.is.object(message)) return false
    return message.type === PAGE_REQUEST
  }

  private isResponse(message: unknown): message is PageResponse {
    if (!this.$.utils.is.object(message)) return false
    return message.type === PAGE_RESPONSE
  }
}
