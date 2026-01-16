export type UpdateRuleOptions = {
  addRules?: Omit<chrome.declarativeNetRequest.Rule, 'id'>[] | undefined
  removeRuleIds?: chrome.declarativeNetRequest.UpdateRuleOptions['removeRuleIds']
}

export class Ext extends sw.Unit {
  id: string
  private bus: ReturnType<gl.Bus['use']>
  private disposers: { [listenerId: string]: Fn } = {}

  constructor(parent: sw.Unit, id: string) {
    super(parent)
    this.id = id
    this.bus = this.$.bus.use(id)
    this.bus.on('buildApiTree', this.buildApiTree, this)
    this.bus.on('callMethod', this.callMethod, this)
    this.bus.on('registerListener', this.registerListener, this)
    this.bus.on('unregisterListener', this.unregisterListener, this)
    this.bus.on('updateSessionRules', this.updateSessionRules, this)
    this.bus.on('updateDynamicRules', this.updateDynamicRules, this)
    // project-ext.ts
    // project-states.ts
    // project-state.ts
  }

  private buildApiTree(node: unknown = this.$.browser) {
    if (this.$.utils.is.object(node)) {
      const subtree: Obj = {}
      for (const key in node) subtree[key] = this.buildApiTree(node[key])
      return subtree
    }

    if (this.$.utils.is.function(node)) {
      if (node.name === 'addListener') return '<addListener>'
      if (node.name === 'hasListener') return '<hasListener>'
      if (node.name === 'hasListeners') return '<hasListeners>'
      if (node.name === 'removeListener') return '<removeListener>'
      return '<method>'
    }

    return node
  }

  private async callMethod(apiPath: string[], methodName: string, ...args: unknown[]) {
    // Get api object
    const api = this.$.utils.get(this.$.browser, apiPath)
    if (!this.$.utils.is.object(api)) throw this.never()

    // Get method from this api object
    const method = api[methodName]
    if (!this.$.utils.is.function(method)) throw this.never()

    // Call method
    return await method.call(api, ...args)
  }

  private registerListener(peerId: string, listenerId: string, path: string[]) {
    // Get api object
    const api = this.$.utils.get(this.$.browser, path)
    if (!this.$.utils.is.object(api)) throw this.never()

    // Prepare proxy callback
    const callback = async (...args: unknown[]) => {
      return await this.bus.send(`listener[${listenerId}]`, ...args)
    }

    // Add listener
    if (!this.$.utils.is.function(api.addListener)) throw this.never()
    api.addListener(callback)

    // Register disposer that removes the listener
    this.disposers[listenerId] = () => {
      clearInterval(pingInterval)
      if (!this.$.utils.is.function(api.removeListener)) throw this.never()
      api.removeListener(callback)
      delete this.disposers[listenerId]
    }

    // Automatically unregister if peer does not respond
    const pingInterval = setInterval(async () => {
      const ok = await this.$.peer.ping(peerId)
      if (ok) return
      this.unregisterListener(listenerId)
    }, this.$.utils.time('5m'))
  }

  private unregisterListener(listenerId: string) {
    this.disposers[listenerId]?.()
  }

  private updateSessionRules(options: UpdateRuleOptions) {
    const fullOptions = {
      ...options,
      addRules: options.addRules ? options.addRules.map(rule => ({ id: 2, ...rule })) : undefined,
    }

    this.$.browser.declarativeNetRequest.updateSessionRules(fullOptions)
  }

  private updateDynamicRules(options: UpdateRuleOptions) {
    const fullOptions = {
      ...options,
      addRules: options.addRules ? options.addRules.map(rule => ({ id: 2, ...rule })) : undefined,
    }

    this.$.browser.declarativeNetRequest.updateDynamicRules(fullOptions)
  }
}
