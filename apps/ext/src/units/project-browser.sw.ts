export class ProjectBrowser extends sw.Unit {
  private $project = this.closest(sw.Project)!
  private bus: ReturnType<gl.Bus['use']>
  private listenerDisposers: { [listenerId: string]: Fn } = {}
  private alarms = new sw.ProjectBrowserAlarms(this)
  private storage = new sw.ProjectBrowserStorage(this)
  private contextMenus = new sw.ProjectBrowserContextMenus(this)
  private notifications = new sw.ProjectBrowserNotifications(this)
  private declarativeNetRequest = new sw.ProjectBrowserDeclarativeNetRequest(this)

  constructor(parent: sw.Unit) {
    super(parent)
    this.bus = this.$.bus.use(`ProjectBrowser[${this.$project.id}]`)
    this.bus.on('getApiTree', this.getApiTree, this)
    this.bus.on('callMethod', this.callMethod, this)
    this.bus.on('addListener', this.addListener, this)
    this.bus.on('removeListener', this.removeListener, this)
  }

  async init() {
    await this.alarms.init()
  }

  async dispose() {
    this.bus.off()
    Object.values(this.listenerDisposers).forEach(dispose => dispose())
    await this.alarms.dispose()
    await this.storage.dispose()
    await this.contextMenus.dispose()
    await this.notifications.dispose()
    await this.declarativeNetRequest.dispose()
  }

  private getApiTree(node: unknown = this.$.browser) {
    if (this.$.utils.is.object(node)) {
      if (node.addListener) return '<event>'
      const subtree: Obj = {}
      for (const key in node) subtree[key] = this.getApiTree(node[key])
      return subtree
    }

    if (this.$.utils.is.function(node)) {
      return '<method>'
    }

    return node
  }

  private async callMethod(path: string, ...args: unknown[]) {
    // Has method interceptor? -> Call it instead of the browser method
    const interceptor = this.getInterceptor(path)
    if (interceptor) return await interceptor(...args)

    // Split path into getter and key
    const getter = path.split('.').slice(0, -1)
    const key = path.split('.').at(-1)
    if (!key) throw this.never()

    // Get api object
    const api = this.$.utils.get(this.$.browser, getter)
    if (!this.$.utils.is.object(api)) throw this.never()

    // Get method
    const method = api[key]
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
      const interceptor = this.getInterceptor(path)
      if (interceptor) {
        const patchedArgs = await interceptor(...args)
        if (!this.$.utils.is.array(patchedArgs)) return
        args = patchedArgs
      }
      return await this.bus.send(`listenerCallback[${listenerId}]`, ...args)
    }

    // Add listener
    if (!this.$.utils.is.function(api.addListener)) throw this.never()
    api.addListener(callback)

    // Register disposer that removes the listener
    this.listenerDisposers[listenerId] = () => {
      clearInterval(pingInterval)
      if (!this.$.utils.is.function(api.removeListener)) throw this.never()
      api.removeListener(callback)
      delete this.listenerDisposers[listenerId]
    }

    // Automatically remove the listener if its peer does not respond
    const pingInterval = setInterval(async () => {
      const ok = await this.$.peer.ping(peerId)
      if (ok) return
      this.removeListener(listenerId)
    }, this.$.utils.time('5m'))
  }

  private removeListener(listenerId: string) {
    this.listenerDisposers[listenerId]?.()
  }

  private getInterceptor(path: string) {
    // Split path into getter and key
    const getter = path.split('.').slice(0, -1)
    const key = path.split('.').at(-1)
    if (!key) throw this.never()

    // Get possible unit that may contain the interceptor
    const unit = this.$.utils.get(this, getter)
    if (!this.$.utils.is.object(unit)) return null

    // Get interceptor method
    const method = unit[key]
    if (!this.$.utils.is.function(method)) return null

    // Return bound interceptor method
    return (...args: unknown[]) => method.call(unit, ...args)
  }

  prefix(key: string | number) {
    return `@${this.$project.id}::${key}`
  }

  unprefix(key: string) {
    return key.replace(`@${this.$project.id}::`, '')
  }

  isPrefixed(key: string) {
    return key.startsWith(`@${this.$project.id}::`)
  }
}
