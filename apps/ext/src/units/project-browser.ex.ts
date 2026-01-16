export const _cbId_ = Symbol('id')

export type Callback = Fn & { [_cbId_]?: string }
export type Chrome = typeof chrome

export class ProjectBrowser extends ex.Unit {
  private $project = this.closest(ex.Project)!
  action = new ex.ProjectBrowserAction(this)
  cookies = new ex.ProjectBrowserCookies(this)
  tabs = new ex.ProjectBrowserTabs(this)
  #api: Obj | null = null
  private apiTree: Obj | null = null
  private bus = this.$.bus.use(`ProjectBrowser[${this.$project.id}]`)
  private listenerIds = new Set<string>()
  static _cbId_ = _cbId_

  async init() {
    this.apiTree = await this.bus.send<Obj>('getApiTree')
    await this.setupApi()
  }

  private async setupApi() {
    this.#api = {
      // No permissions required
      action: this.action.createApi(),
      tabs: this.tabs.createApi(),

      // Provided with mandatory permissions
      // asdsadsad...

      // Optional permissions
      // TODO: cookies api is optional
      cookies: this.cookies.createApi(),
    }
  }

  get api() {
    if (!this.#api) throw this.never()
    return this.#api
  }

  getValue(path: string) {
    if (!this.apiTree) throw this.never()
    return this.$.utils.get(this.apiTree, path.split('.'))
  }

  createMethod(path: string) {
    return this.callMethod.bind(this, path)
  }

  createEvent(path: string) {
    return {
      addListener: this.addListener.bind(this, path),
      hasListener: this.hasListener.bind(this, path),
      hasListeners: this.hasListeners.bind(this, path),
      removeListener: this.removeListener.bind(this, path),
      dispatch: this.callMethod.bind(this, `${path}.dispatch`),
    }
  }

  private callMethod(path: string, ...args: unknown[]) {
    return this.bus.send<sw.ProjectBrowser['callMethod']>('callMethod', path, ...args)
  }

  private addListener(path: string, cb?: Callback) {
    if (!cb) return
    cb[_cbId_] ??= this.$.utils.id()
    const listenerId = this.buildListenerId(path, cb)
    if (this.listenerIds.has(listenerId)) return
    this.listenerIds.add(listenerId)
    this.bus.on(`listenerCallback[${listenerId}]`, cb)
    void this.bus.send('addListener', path, this.$.peer.id, listenerId)
  }

  private hasListener(path: string, cb: Callback) {
    if (!cb || !cb[_cbId_]) return false
    const listenerId = this.buildListenerId(path, cb)
    return this.listenerIds.has(listenerId)
  }

  private hasListeners(path: string) {
    return [...this.listenerIds].some(id => id.startsWith(`${path}[`))
  }

  private removeListener(path: string, cb: Callback) {
    if (!cb || !cb[_cbId_]) return
    const listenerId = this.buildListenerId(path, cb)
    if (!this.listenerIds.has(listenerId)) return
    this.bus.off(`listenerCallback[${listenerId}]`)
    this.listenerIds.delete(listenerId)
    void this.bus.send('removeListener', listenerId)
  }

  private buildListenerId(path: string, cb: Callback) {
    return `${path}[${cb[_cbId_]}]`
  }
}

// this.$.browser.alarms.create
// IDEA: keep array of "disposers"
// ['alarms.remove', name]
// ['alarms.onAlarm.removeListener', listenerId]

// // MANAGE LISTENERS
// // ---------------------------------------------------------------------------

// private addListener(path: string, cb?: Callback) {
//   if (!cb) return
//   cb[_cbId_] ??= this.$.utils.id()

//   const listenerId = this.buildListenerId(path, cb)
//   if (this.listenerIds.has(listenerId)) return

//   this.listenerIds.add(listenerId)
//   this.bus.on(`listener[${listenerId}]`, cb)
//   void this.bus.send('registerListener', this.$.peer.id, listenerId, path)
// }

// private hasListener(path: string, cb: Callback) {
//   if (!cb || !cb[_cbId_]) return false
//   const listenerId = this.buildListenerId(path, cb)
//   return this.listenerIds.has(listenerId)
// }

// private hasListeners(path: string) {
//   return [...this.listenerIds].some(id => id.startsWith(`${path}[`))
// }

// private removeListener(path: string, cb: Callback) {
//   if (!cb || !cb[_cbId_]) return

//   const listenerId = this.buildListenerId(path, cb)
//   if (!this.listenerIds.has(listenerId)) return

//   this.bus.off(`listener[${listenerId}]`)
//   this.listenerIds.delete(listenerId)
//   void this.bus.send('unregisterListener', listenerId)
// }

// private buildListenerId(path: string, cb: Callback) {
//   return `${path}[${cb[_cbId_]}]`
// }

// // CALL METHOD
// // ---------------------------------------------------------------------------

// // Do not make this method async, 'runtime.getURL' must be sync
// private callMethod(apiPath: string[], methodName: string, ...args: unknown[]) {
//   // Handle special methods
//   const getter = [...apiPath, methodName].join('.')

//   // It is important to have runtime.getURL as sync
//   if (getter === 'runtime.getURL') {
//     const path = args[0] as string
//     return this['runtime.getURL'](path)
//   } else if (getter === 'permissions.request') {
//     const permissions = args[0] as chrome.permissions.Permissions
//     return this['permissions.request'](permissions)
//   }
//   // else if (getter === 'declarativeNetRequest.updateSessionRules') {
//   //   const options = args[0] as UpdateRuleOptions
//   //   return this.bus.send('updateSessionRules', options)
//   // } else if (getter === 'declarativeNetRequest.updateDynamicRules') {
//   //   const options = args[0] as UpdateRuleOptions
//   //   return this.bus.send('updateDynamicRules', options)
//   // }

//   // Call method via `sw`
//   return this.bus.send('callMethod', apiPath, methodName, ...args)
// }

// // BROWSER API OVERRIDES
// // ---------------------------------------------------------------------------

// private 'runtime.getURL'(path: string) {
//   const base = `chrome-extension://${this.api.runtime.id}/`
//   return new URL(path, base).href
// }

// private async 'permissions.request'(opts: chrome.permissions.Permissions) {
//   // Check if permissions are already granted
//   const alreadyGranted = await this.api.permissions.contains(opts)
//   if (alreadyGranted) return true

//   // Prepare permission url
//   const url = this.api.runtime.getURL(this.$.env.url.system({ type: 'permission' }))

//   // Close all permission tabs
//   const tabs = await this.api.tabs.query({ url })
//   await Promise.all(tabs.map(tab => tab.id && this.api.tabs.remove(tab.id)))

//   // Create new permission tab and wait till it is ready for requesting
//   await this.api.tabs.create({ url, active: false, pinned: true })
//   await this.bus.waitSignal('App.ready[system:permission]')

//   // Request permissions
//   const request = this.bus.send<PermissionResult>('requestPermissions', opts)
//   const [result, error] = await this.$.utils.safe(request)

//   // Close permission tab
//   await this.bus.send('closePermissionTab')

//   // Error? -> Throw
//   if (error) throw error

//   // Update API object as new APIs might be added
//   if (!result) throw this.never()
//   if (result.granted) await this.initApi()

//   return result
// }

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

// private async initApi() {
//   const apiTree = await this.bus.send<Obj>('createApiTree')
//   if (!apiTree) throw this.never()
//   this.#api = this.createApi(apiTree)
//   this.#api.action = this.action.api
// }

// get api() {
//   if (!this.#api) throw this.never()
//   return this.#api
// }

// TODO: no path, should return Browser type
// private createApi<T>(node: T, path: string[] = []): any {
//   if (this.$.utils.is.object(node)) {
//     const api: Obj = {}
//     for (const key in node) api[key] = this.createApi(node[key], [...path, key])
//     return api
//   }

//   if (this.$.utils.is.string(node) && node.startsWith('<')) {
//     const apiPath = path.slice(0, -1).join('.')

//     if (node === '<addListener>') return this.addListener.bind(this, apiPath)
//     if (node === '<hasListener>') return this.hasListener.bind(this, apiPath)
//     if (node === '<hasListeners>') return this.hasListeners.bind(this, apiPath)
//     if (node === '<removeListener>') return this.removeListener.bind(this, apiPath)

//     if (node === '<method>') {
//       // const methodName = path.at(-1) as string
//       return this.callMethod.bind(this, path.join('.'))
//     }
//   }

//   return node
// }
