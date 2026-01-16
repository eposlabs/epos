export type UpdateRuleOptions = {
  addRules?: Omit<chrome.declarativeNetRequest.Rule, 'id'>[] | undefined
  removeRuleIds?: chrome.declarativeNetRequest.UpdateRuleOptions['removeRuleIds']
}

export class ProjectBrowser extends sw.Unit {
  private $project = this.closest(sw.Project)!
  private bus: ReturnType<gl.Bus['use']>
  private disposers: { [listenerId: string]: Fn } = {}

  constructor(parent: sw.Unit) {
    super(parent)
    this.bus = this.$.bus.use(`ProjectBrowser[${this.$project.id}]`)
    this.bus.on('getApiTree', this.getApiTree, this)
    this.bus.on('callMethod', this.callMethod, this)
    this.bus.on('addListener', this.addListener, this)
    this.bus.on('removeListener', this.removeListener, this)
  }

  dispose() {
    this.bus.off()
  }

  private getApiTree(node: unknown = this.$.browser) {
    if (this.$.utils.is.object(node)) {
      const subtree: Obj = {}
      for (const key in node) subtree[key] = this.getApiTree(node[key])
      return subtree
    }

    if (this.$.utils.is.function(node)) {
      return '<function>'
    }

    return node
  }

  private async callMethod(path: string, ...args: unknown[]) {
    const apiGetter = path.split('.').slice(0, -1)
    const methodName = path.split('.').at(-1)
    if (!methodName) throw this.never()

    // Get api object
    const api = this.$.utils.get(this.$.browser, apiGetter)
    if (!this.$.utils.is.object(api)) throw this.never()

    // Get method from this api object
    const method = api[methodName]
    if (!this.$.utils.is.function(method)) throw this.never()

    // Call method
    return await method.call(api, ...args)
  }

  private addListener(path: string, peerId: string, listenerId: string) {
    // Get api object
    const api = this.$.utils.get(this.$.browser, path.split('.'))
    if (!this.$.utils.is.object(api)) throw this.never()

    // Prepare callback
    const callback = async (...args: unknown[]) => {
      return await this.bus.send(`listenerCallback[${listenerId}]`, ...args)
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

    // Automatically remove the listener if its peer does not respond
    const pingInterval = setInterval(async () => {
      const ok = await this.$.peer.ping(peerId)
      if (ok) return
      this.removeListener(listenerId)
    }, this.$.utils.time('5m'))
  }

  private removeListener(listenerId: string) {
    this.disposers[listenerId]?.()
  }
}

// this.bus.on('updateSessionRules', this.updateSessionRules, this)
// this.bus.on('updateDynamicRules', this.updateDynamicRules, this)
// private updateSessionRules(options: UpdateRuleOptions) {
// const fullOptions = {
//   ...options,
//   addRules: options.addRules ? options.addRules.map(rule => ({ id: 2, ...rule })) : undefined,
// }

// this.$.browser.declarativeNetRequest.updateSessionRules(fullOptions)
// }

// private updateDynamicRules(options: UpdateRuleOptions) {
// const fullOptions = {
//   ...options,
//   addRules: options.addRules ? options.addRules.map(rule => ({ id: 2, ...rule })) : undefined,
// }

// this.$.browser.declarativeNetRequest.updateDynamicRules(fullOptions)
// }
