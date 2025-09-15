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
      this.setupServiceWorker()
    } else if (this.$.env.is.csTab || this.$.env.is.vw || this.$.env.is.os) {
      this.setupHost()
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

  async sendToTab(tabId: number, name: string, ...args: unknown[]) {
    const req = this.createRequest(name, args)
    const [result, error] = await this.$.utils.safe(() => this.$.browser.tabs.sendMessage(tabId, req))
    if (error && this.isIgnoredError(error)) return null
    if (error) throw error

    if (this.$.is.undefined(result)) return null // No handlers
    if (!this.$.is.string(result)) throw this.never
    return await this.$bus.serializer.deserialize(result)
  }

  private setupServiceWorker() {
    this.$.browser.tabs.onRemoved.addListener(tabId => {
      this.$bus.actions = this.$bus.actions.filter(action => action.target !== tabId)
    })

    this.$.browser.runtime.onMessage.addListener((req, sender, respond) => {
      if (!this.isRequest(req)) return

      // For messages from os / vw tab.id is undefined, for tabs it is a number
      const tabId = sender.tab?.id

      // Register tab proxy for messages from [cs-tab]
      if (req.name === 'bus.registerTabAction') {
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

      // Unregister tab proxy for messages from [cs-tab]
      if (req.name === 'bus.unregisterTabAction') {
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

      // Unregister all tab proxies for [cs-tab]
      if (req.name === 'bus.unregisterAllTabActions') {
        if (!this.$.is.number(tabId)) throw this.never
        this.$bus.actions = this.$bus.actions.filter(action => action.target !== tabId)
        return
      }

      // From [os]
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

      // tabId is present only for messages from [cs-tab], exclude proxy action for this tab
      const actions = this.$bus.actions.filter(
        action => action.name === req.name && (!tabId || action.target !== tabId),
      )

      // No actions? -> Ignore
      if (actions.length === 0) return

      // Call all matching actions
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

  private setupHost() {
    // Unregister all proxy actions left from previous tab's content script.
    // This happens on tab refresh or navigation.
    if (this.$.env.is.csTab) {
      async: this.send('bus.unregisterAllTabActions')
    }

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
