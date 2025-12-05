export const PAGE_REQUEST = ':EPOS_BUS_PAGE_REQUEST'
export const PAGE_RESPONSE = ':EPOS_BUS_PAGE_RESPONSE'

export type PageRequest = {
  type: typeof PAGE_REQUEST
  id: string
  name: string
  args: unknown[]
  appId: string
  peerId: string
}

export type PageResponse = {
  type: typeof PAGE_RESPONSE
  reqId: string
  result: unknown
}

export class BusPageBridge extends gl.Unit {
  private $bus = this.closest(gl.Bus)!
  private removedContextListeners = new Set<(source: WindowProxy) => void>()
  static PAGE_REQUEST = PAGE_REQUEST
  static PAGE_RESPONSE = PAGE_RESPONSE

  constructor(parent: gl.Unit) {
    super(parent)

    if (this.$.env.is.csTop || this.$.env.is.os || this.$.env.is.vw) {
      this.setupCsTopOsVw()
    } else if (this.$.env.is.csFrame || this.$.env.is.ex) {
      this.setupCsFrameEx()
    }

    // `csTop`, `csFrame`, `vw` and `os` should watch for removed iframes to remove related actions
    if (this.$.env.is.csTop || this.$.env.is.csFrame || this.$.env.is.vw || this.$.env.is.os) {
      this.watchForRemovedIframes()
    }
  }

  async sendToTop(name: string, ...args: unknown[]) {
    if (!self.top) throw this.never()
    return await this.sendToContext(self.top, name, ...args)
  }

  private async sendToContext(context: WindowProxy, name: string, ...args: unknown[]) {
    const req = this.createRequest(name, args)
    context.postMessage(req, '*')
    return await this.waitForResponse(req.id, context)
  }

  private setupCsTopOsVw() {
    // Listen for page messages from `csFrame` and `ex`.
    // This listener triggers on any message (event its own), but we filter out non-matching ones.
    self.addEventListener('message', async e => {
      const req = e.data
      if (!this.isRequest(req)) return
      if (req.peerId === this.$bus.peerId) return

      // TODO: in which cases source === null?
      const source = e.source as WindowProxy | null
      if (!source) return

      // Register proxy action for the specified context (`csFrame` / `ex`).
      if (req.name === 'Bus.registerContextProxyAction') {
        const [name] = req.args
        if (!this.$.utils.is.string(name)) throw this.never()
        const fn = (...args: unknown[]) => this.sendToContext(source, name, ...args)
        this.$bus.on(name, fn, null, source)
        return
      }

      // Remove proxy action for the specified context (`csFrame` / `ex`).
      if (req.name === 'Bus.removeContextProxyAction') {
        const [name] = req.args
        if (!this.$.utils.is.string(name)) throw this.never()
        this.$bus.off(name, null, source)
        return
      }

      // Remove all proxy actions for the specified context (`csFrame` / `ex`).
      if (req.name === 'Bus.removeAllContextProxyActions') {
        this.removedContextListeners.forEach(fn => fn(source))
        this.$bus.actions = this.$bus.actions.filter(action => action.target !== source)
        return
      }

      // Remove all proxy actions whose targets no longer exist
      if (req.name === 'Bus.invalidateProxyActions') {
        this.invalidateProxyActions()
        return
      }

      // Take matching actions, filter out proxy actions targeting the `source`
      const actions = this.$bus.actions.filter(action => action.name === req.name && action.target !== source)

      // Execute actions
      const result = await this.$bus.utils.pick([
        ...actions.map(action => action.execute(...req.args)),
        this.$bus.extBridge.send(req.name, ...req.args),
      ])

      // Respond with the result
      const res = this.createResponse(req.id, result)
      source.postMessage(res, '*')
    })
  }

  private setupCsFrameEx() {
    // Remove all proxy actions left from the previous `csFrame` / `exFrame`.
    // This happens on iframe refresh or page navigation inside an iframe.
    // `csFrame` and `exFrame` run in the same context (WindowProxy), but call for both, because
    // for `<background>` frames, only `exFrame` is present, and for web frames, `exFrame` may be absent.
    async: this.sendToTop('Bus.removeAllContextProxyActions')

    // Listen for messages from `csTop` / `vw` / `os`.
    // The listener is attached to `self`, so only targeted messages are handled.
    self.addEventListener('message', async e => {
      const req = e.data
      if (!this.isRequest(req)) return

      const actions = this.$bus.actions.filter(action => action.name === req.name)
      if (actions.length === 0) return

      const result = await this.$bus.utils.pick(actions.map(action => action.execute(...req.args)))
      const res = this.createResponse(req.id, result)
      if (!self.top) throw this.never()
      self.top.postMessage(res, '*')
    })
  }

  private async waitForResponse(reqId: string, context: WindowProxy) {
    const result$ = Promise.withResolvers()

    // Wait for the response message
    const onMessage = (e: MessageEvent) => {
      const res = e.data
      if (!this.isResponse(res)) return
      if (res.reqId !== reqId) return
      result$.resolve(res.result)
    }
    self.addEventListener('message', onMessage)

    // Context removed? -> Resolve with null
    const onRemovedContext = (removedContext: WindowProxy) => {
      if (removedContext !== context) return
      result$.resolve(null)
    }
    this.removedContextListeners.add(onRemovedContext)

    // Wait limit reached? -> Resolve with null
    const timeout = self.setTimeout(() => result$.resolve(null), 10_000)

    // Wait for the result
    const result = await result$.promise

    // Cleanup
    self.clearTimeout(timeout)
    self.removeEventListener('message', onMessage)
    this.removedContextListeners.delete(onRemovedContext)

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
            async: this.sendToTop('Bus.invalidateProxyActions')
          } else {
            this.invalidateProxyActions()
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
  private invalidateProxyActions() {
    const availableContexts = new Set<WindowProxy>([self, ...this.getAllFrames()])

    this.$bus.actions = this.$bus.actions.filter(action => {
      // No target? -> Keep action
      if (!action.target) return true

      // Target is available? -> Keep action
      const target = action.target as WindowProxy
      if (availableContexts.has(target)) return true

      // Target removed? -> Remove action and notify listeners
      this.removedContextListeners.forEach(fn => fn(target))
      return false
    })
  }

  /** Recursively get all frames within the specified root (default: `self`). */
  private getAllFrames(root: WindowProxy = self): WindowProxy[] {
    const frames: WindowProxy[] = []

    for (let i = 0; i < root.frames.length; i++) {
      const frame = root.frames[i]
      const subframes = this.getAllFrames(frame)
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
      appId: this.$bus.appId,
      peerId: this.$bus.peerId,
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
