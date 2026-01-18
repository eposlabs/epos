export const EXT_REQUEST = ':EPOS_BUS_EXT_REQUEST'

export type ExtRequest = {
  type: typeof EXT_REQUEST
  name: string
  argsJson: string
}

export class BusExtBridge extends gl.Unit {
  private $bus = this.closest(gl.Bus)!
  static EXT_REQUEST = EXT_REQUEST

  constructor(parent: gl.Unit) {
    super(parent)

    if (this.$.env.is.sw) {
      this.setupSw()
    } else if (this.$.env.is.csTop || this.$.env.is.vw || this.$.env.is.os) {
      this.setupCsTopVwOs()
    }
  }

  async send<T>(name: string, ...args: unknown[]) {
    const req = this.createRequest(name, args)
    const [result, error] = await this.$.utils.safe(() => this.$.browser.runtime.sendMessage(req))
    if (error && this.isIgnoredError(error)) return null
    if (error) throw error

    if (this.$.utils.is.undefined(result)) return null // No handlers
    if (!this.$.utils.is.string(result)) throw this.never()
    return (await this.$bus.serializer.deserialize(result)) as T
  }

  private async sendToTab(tabId: number, name: string, ...args: unknown[]) {
    const req = this.createRequest(name, args)
    const [result, error] = await this.$.utils.safe(() => this.$.browser.tabs.sendMessage(tabId, req))
    if (error && this.isIgnoredError(error)) return null
    if (error) throw error

    if (this.$.utils.is.undefined(result)) return null // No handlers
    if (!this.$.utils.is.string(result)) throw this.never()
    return await this.$bus.serializer.deserialize(result)
  }

  private setupSw() {
    // Remove proxy actions for closed tabs
    this.$.browser.tabs.onRemoved.addListener(tabId => {
      this.$bus.actions = this.$bus.actions.filter(action => action.target !== tabId)
    })

    // Listen for runtime messages from `csTop`, `os`, and `vw`
    this.$.browser.runtime.onMessage.addListener((req, sender, respond) => {
      if (!this.isRequest(req)) return

      // `tabId` is a number for messages from `csTop` and `csFrame` inside tab.
      // `tabId` is null for messages from `os`, `vw`, and `csFrame` inside offscreen.
      const tabId = sender.tab?.id ?? null

      // Get tab id for the specified tab (`csTop`)
      if (req.name === 'Bus.getTabId') {
        if (!tabId === null) throw this.never()
        respond(this.$bus.serializer.serialize(tabId))
        return true
      }

      // Register proxy action for the specified tab (`csTop`)
      if (req.name === 'Bus.registerTabProxyAction') {
        void (async () => {
          if (!tabId) throw this.never()
          const args = await this.$bus.serializer.deserialize(req.argsJson)
          if (!this.$.utils.is.array(args)) throw this.never()
          const [name] = args
          if (!this.$.utils.is.string(name)) throw this.never()
          const fn = (...args: unknown[]) => this.sendToTab(tabId, name, ...args)
          this.$bus.on(name, fn, null, tabId)
        })()
        return
      }

      // Remove proxy action for the specified tab (`csTop`)
      if (req.name === 'Bus.removeTabProxyAction') {
        void (async () => {
          if (!tabId) throw this.never()
          const args = await this.$bus.serializer.deserialize(req.argsJson)
          if (!this.$.utils.is.array(args)) throw this.never()
          const [name] = args
          if (!this.$.utils.is.string(name)) throw this.never()
          this.$bus.off(name, null, tabId)
        })()
        return
      }

      // Remove all proxy actions for the specified tab (`csTop`)
      if (req.name === 'Bus.removeAllTabProxyActions') {
        if (!tabId) throw this.never()
        this.$bus.actions = this.$bus.actions.filter(action => action.target !== tabId)
        return
      }

      // Get page token required for secure `cs` <-> `ex` communication.
      // For tab frames, the token is retrieved through this flow: `csFrame` -> `sw` -> `csTop` -> `sw` -> `csFrame`.
      // For offscreen frames, the page token is `null` (same as in `os` itself).
      if (req.name === 'Bus.getPageToken') {
        void (async () => {
          // Called from tab's frame? -> Get page token from `csTop`
          if (tabId) {
            const pageToken = await this.sendToTab(tabId, 'Bus.getPageToken')
            respond(this.$bus.serializer.serialize(pageToken))
          }
          // Called from offscreen's frame? -> Return null
          else {
            respond(this.$bus.serializer.serialize(null))
          }
        })()
        return true
      }

      if (req.name === 'Bus.blobIdToObjectUrl') {
        // Special method for blobs support, see BusSerializer for details
        void (async () => {
          const args = await this.$bus.serializer.deserialize(req.argsJson)
          if (!this.$.utils.is.array(args)) throw this.never()
          const [blobId] = args
          if (!this.$.utils.is.string(blobId)) throw this.never()
          const url = await this.$bus.serializer.blobIdToObjectUrl(blobId)
          respond(this.$bus.serializer.serialize(url))
        })()
        return true
      }

      // `tabId` is present only for messages from `csTop`, so exclude proxy action for this tab if any
      const actions = this.$bus.actions.filter(
        action => action.name === req.name && (!tabId || action.target !== tabId),
      )

      // No actions? -> Ignore message
      if (actions.length === 0) return

      // Execute actions and respond with the result
      void (async () => {
        const args = await this.$bus.serializer.deserialize(req.argsJson)
        if (!this.$.utils.is.array(args)) throw this.never()
        const result = await this.$bus.utils.pick(actions.map(action => action.execute(...args)))
        respond(this.$bus.serializer.serialize(result))
      })()

      return true
    })
  }

  private setupCsTopVwOs() {
    // Remove all proxy actions left from the previous `csTop`.
    // This happens on tab refresh or page navigation.
    if (this.$.env.is.csTop) {
      void this.send('Bus.removeAllTabProxyActions')
    }

    // Listen for runtime messages from other peers
    this.$.browser.runtime.onMessage.addListener((req, _, respond) => {
      if (!this.isRequest(req)) return

      // Give page token to `csFrame` (`csFrame` -> `sw` -> `csTop` -> `sw` -> `csFrame`)
      if (this.$.env.is.csTop && req.name === 'Bus.getPageToken') {
        respond(this.$bus.serializer.serialize(this.$bus.pageToken))
        return true
      }

      const actions = this.$bus.actions.filter(action => action.name === req.name)
      if (actions.length === 0) return

      void (async () => {
        const args = await this.$bus.serializer.deserialize(req.argsJson)
        if (!this.$.utils.is.array(args)) throw this.never()
        const result = await this.$bus.utils.pick(actions.map(action => action.execute(...args)))
        respond(this.$bus.serializer.serialize(result))
      })()

      return true
    })
  }

  private createRequest(name: string, args: unknown[]): ExtRequest {
    return {
      type: EXT_REQUEST,
      name: name,
      argsJson: this.$bus.serializer.serialize(args),
    }
  }

  private isRequest(message: unknown): message is ExtRequest {
    if (!this.$.utils.is.object(message)) return false
    return message.type === EXT_REQUEST
  }

  private isIgnoredError(e: unknown): boolean {
    if (!(e instanceof Error)) return false
    return e.message.includes('Receiving end does not exist.') || e.message.includes('Extension context invalidated.')
  }
}
