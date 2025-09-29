export const EXT_REQUEST = ':EPOS_BUS_EXT_REQUEST'

export type ExtRequest = {
  type: typeof EXT_REQUEST
  name: string
  argsJson: string
  busId: string
}

export class BusExtBridge extends $gl.Unit {
  private $bus = this.up($gl.Bus)!
  static EXT_REQUEST = EXT_REQUEST

  constructor(parent: $gl.Unit) {
    super(parent)

    if (this.$.env.is.sw) {
      this.setupSw()
    } else if (this.$.env.is.csTop || this.$.env.is.vw || this.$.env.is.os) {
      this.setupCsTopVwOs()
    }
  }

  async send(name: string, ...args: unknown[]) {
    const req = this.createRequest(name, args)
    const [result, error] = await this.$.utils.safe(() => this.$.browser.runtime.sendMessage(req))
    if (error && this.isIgnoredError(error)) return null
    if (error) throw error

    if (this.$.is.undefined(result)) return null // No handlers
    if (!this.$.is.string(result)) throw this.never
    return await this.$bus.serializer.deserialize(result)
  }

  private async sendToTab(tabId: number, name: string, ...args: unknown[]) {
    const req = this.createRequest(name, args)
    const [result, error] = await this.$.utils.safe(() => this.$.browser.tabs.sendMessage(tabId, req))
    if (error && this.isIgnoredError(error)) return null
    if (error) throw error

    if (this.$.is.undefined(result)) return null // No handlers
    if (!this.$.is.string(result)) throw this.never
    return await this.$bus.serializer.deserialize(result)
  }

  private setupSw() {
    // Remove proxy actions for closed tabs
    this.$.browser.tabs.onRemoved.addListener(tabId => {
      this.$bus.actions = this.$bus.actions.filter(action => action.target !== tabId)
    })

    // Listen for runtime messages from [csTop], [os] and [vw]
    this.$.browser.runtime.onMessage.addListener((req, sender, respond) => {
      if (!this.isRequest(req)) return

      // For messages from [csTop], `tabId` is a number.
      // For messages from [os] / [vw], `tabId` is undefined.
      const tabId = sender.tab?.id

      // Register proxy action for [csTop]
      if (req.name === 'bus.registerProxyAction') {
        async: (async () => {
          if (!this.$.is.number(tabId)) throw this.never
          const args = await this.$bus.serializer.deserialize(req.argsJson)
          if (!this.$.is.array(args)) throw this.never
          const [name] = args
          if (!this.$.is.string(name)) throw this.never
          const fn = (...args: unknown[]) => this.sendToTab(tabId, name, ...args)
          this.$bus.on(name, fn, undefined, tabId)
        })()
        return
      }

      // Unregister proxy action for [csTop]
      if (req.name === 'bus.unregisterProxyAction') {
        async: (async () => {
          if (!this.$.is.number(tabId)) throw this.never
          const args = await this.$bus.serializer.deserialize(req.argsJson)
          if (!this.$.is.array(args)) throw this.never
          const [name] = args
          if (!this.$.is.string(name)) throw this.never
          this.$bus.off(name, undefined, tabId)
        })()
        return
      }

      // Clear proxy actions for specified tab
      if (req.name === 'bus.clearTabProxyActions') {
        if (!this.$.is.number(tabId)) throw this.never
        this.$bus.actions = this.$bus.actions.filter(action => action.target !== tabId)
        return
      }

      // Special method for blobs support, see bus-serializer for details
      if (req.name === 'bus.blobIdToObjectUrl') {
        async: (async () => {
          const args = await this.$bus.serializer.deserialize(req.argsJson)
          if (!this.$.is.array(args)) throw this.never
          const [blobId] = args
          if (!this.$.is.string(blobId)) throw this.never
          const url = await this.$bus.serializer.blobIdToObjectUrl(blobId)
          const resultJson = this.$bus.serializer.serialize(url)
          respond(resultJson)
        })()
        return true
      }

      // `tabId` is present only for messages from [csTop], exclude proxy action for this tab
      const actions = this.$bus.actions.filter(
        action => action.name === req.name && (!tabId || action.target !== tabId),
      )

      // No actions? -> Ignore message
      if (actions.length === 0) return

      // Execute actions and respond with the result
      async: (async () => {
        const args = await this.$bus.serializer.deserialize(req.argsJson)
        if (!this.$.is.array(args)) throw this.never
        const result = await this.$bus.utils.pick(actions.map(action => action.execute(...args)))
        const resultJson = this.$bus.serializer.serialize(result)
        respond(resultJson)
      })()

      return true
    })
  }

  private setupCsTopVwOs() {
    // Remove all proxy actions left from the previous [csTop].
    // This happens on tab refresh or page navigation.
    if (this.$.env.is.csTop) {
      async: this.send('bus.clearTabProxyActions')
    }

    // Listen for runtime messages from other peers
    this.$.browser.runtime.onMessage.addListener((req, _, respond) => {
      if (!this.isRequest(req)) return

      const actions = this.$bus.actions.filter(action => action.name === req.name)
      if (actions.length === 0) return

      async: (async () => {
        const args = await this.$bus.serializer.deserialize(req.argsJson)
        if (!this.$.is.array(args)) throw this.never
        const result = await this.$bus.utils.pick(actions.map(action => action.execute(...args)))
        const resultJson = this.$bus.serializer.serialize(result)
        respond(resultJson)
      })()

      return true
    })
  }

  private createRequest(name: string, args: unknown[]): ExtRequest {
    return {
      type: EXT_REQUEST,
      name: name,
      argsJson: this.$bus.serializer.serialize(args),
      busId: this.$bus.id,
    }
  }

  private isRequest(message: unknown): message is ExtRequest {
    if (!this.$.is.object(message)) return false
    return message.type === EXT_REQUEST
  }

  private isIgnoredError(e: unknown): boolean {
    if (!(e instanceof Error)) return false
    return (
      e.message.includes('Receiving end does not exist.') ||
      e.message.includes('Extension context invalidated.')
    )
  }
}
