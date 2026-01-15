export type UpdateRuleOptions = {
  addRules?: Omit<chrome.declarativeNetRequest.Rule, 'id'>[] | undefined
  removeRuleIds?: chrome.declarativeNetRequest.UpdateRuleOptions['removeRuleIds']
}

export class Ext extends sw.Unit {
  private disposers: { [listenerId: string]: Fn } = {}

  constructor(parent: sw.Unit) {
    super(parent)
    this.$.bus.on('Ext.getApiTree', () => this.getApiTree(this.$.browser))
    this.$.bus.on('Ext.callMethod', this.callMethod, this)
    this.$.bus.on('Ext.registerListener', this.registerListener, this)
    this.$.bus.on('Ext.unregisterListener', this.unregisterListener, this)
    this.$.bus.on('Ext.updateSessionRules', this.updateSessionRules, this)
    this.$.bus.on('Ext.updateDynamicRules', this.updateDynamicRules, this)
  }

  private getApiTree(value: unknown) {
    if (this.$.utils.is.object(value)) {
      const tree: Obj = {}
      for (const key in value) {
        tree[key] = this.getApiTree(value[key])
      }
      return tree
    }

    if (this.$.utils.is.function(value)) {
      if (value.name === 'addListener') return '<addListener>'
      if (value.name === 'hasListener') return '<hasListener>'
      if (value.name === 'hasListeners') return '<hasListeners>'
      if (value.name === 'removeListener') return '<removeListener>'
      return '<method>'
    }

    return value
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
      return await this.$.bus.send(`Ext.listener[${listenerId}]`, ...args)
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
