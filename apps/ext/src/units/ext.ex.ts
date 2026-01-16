import type { PermissionResult } from './ext.sm.js'

export const _cbId_ = Symbol('id')

export type Callback = Fn & { [_cbId_]?: string }
export type Chrome = typeof chrome

export class Ext extends ex.Unit {
  id: string
  #api: Chrome | null = null
  private bus: ReturnType<gl.Bus['use']>
  private listenerIds = new Set<string>()
  static _cbId_ = _cbId_

  constructor(parent: ex.Unit, id: string) {
    super(parent)
    this.id = id
    this.bus = this.$.bus.use(id)
    // this.$.browser.alarms.create
    // IDEA: keep array of "disposers"
    // ['alarms.remove', name]
    // ['alarms.onAlarm.removeListener', listenerId]
  }

  async init() {
    await this.initApi()
  }

  private async initApi() {
    const apiTree = await this.bus.send<Obj>('buildApiTree')
    if (!apiTree) throw this.never()
    this.#api = await this.createApi(apiTree)
  }

  get api() {
    if (!this.#api) throw this.never()
    return this.#api
  }

  // TODO: no path, should return Browser type
  private createApi<T>(value: T, path: string[] = []): any {
    if (this.$.utils.is.object(value)) {
      const api: Obj = {}
      for (const key in value) api[key] = this.createApi(value[key], [...path, key])
      return api
    }

    if (this.$.utils.is.string(value) && value.startsWith('<')) {
      const apiPath = path.slice(0, -1)

      if (value === '<addListener>') return this.addListener.bind(this, apiPath)
      if (value === '<hasListener>') return this.hasListener.bind(this, apiPath)
      if (value === '<hasListeners>') return this.hasListeners.bind(this, apiPath)
      if (value === '<removeListener>') return this.removeListener.bind(this, apiPath)

      if (value === '<method>') {
        const methodName = path.at(-1) as string
        return this.callMethod.bind(this, apiPath, methodName)
      }
    }

    return value
  }

  // MANAGE LISTENERS
  // ---------------------------------------------------------------------------

  private addListener(apiPath: string[], cb?: Callback) {
    if (!cb) return
    cb[_cbId_] ??= this.$.utils.id()

    const listenerId = this.buildListenerId(apiPath, cb)
    if (this.listenerIds.has(listenerId)) return

    this.listenerIds.add(listenerId)
    this.bus.on(`listener[${listenerId}]`, cb)
    void this.bus.send('registerListener', this.$.peer.id, listenerId, apiPath)
  }

  private hasListener(apiPath: string[], cb: Callback) {
    if (!cb || !cb[_cbId_]) return false
    const listenerId = this.buildListenerId(apiPath, cb)
    return this.listenerIds.has(listenerId)
  }

  private hasListeners(apiPath: string[]) {
    const prefix = this.buildListenerIdPrefix(apiPath)
    return [...this.listenerIds].some(id => id.startsWith(prefix))
  }

  private removeListener(apiPath: string[], cb: Callback) {
    if (!cb || !cb[_cbId_]) return

    const listenerId = this.buildListenerId(apiPath, cb)
    if (!this.listenerIds.has(listenerId)) return

    this.bus.off(`listener[${listenerId}]`)
    this.listenerIds.delete(listenerId)
    void this.bus.send('unregisterListener', listenerId)
  }

  private buildListenerId(apiPath: string[], cb: Callback) {
    return `${apiPath.join('.')}[${cb[_cbId_]}]`
  }

  private buildListenerIdPrefix(apiPath: string[]) {
    return `${apiPath.join('.')}[`
  }

  // CALL METHOD
  // ---------------------------------------------------------------------------

  // Do not make this method async, 'runtime.getURL' must be sync
  private callMethod(apiPath: string[], methodName: string, ...args: unknown[]) {
    // Handle special methods
    const getter = [...apiPath, methodName].join('.')

    // It is important to have runtime.getURL as sync
    if (getter === 'runtime.getURL') {
      const path = args[0] as string
      return this['runtime.getURL'](path)
    } else if (getter === 'permissions.request') {
      const permissions = args[0] as chrome.permissions.Permissions
      return this['permissions.request'](permissions)
    }
    // else if (getter === 'declarativeNetRequest.updateSessionRules') {
    //   const options = args[0] as UpdateRuleOptions
    //   return this.bus.send('updateSessionRules', options)
    // } else if (getter === 'declarativeNetRequest.updateDynamicRules') {
    //   const options = args[0] as UpdateRuleOptions
    //   return this.bus.send('updateDynamicRules', options)
    // }

    // Call method via `sw`
    return this.bus.send('callMethod', apiPath, methodName, ...args)
  }

  // BROWSER API OVERRIDES
  // ---------------------------------------------------------------------------

  private 'runtime.getURL'(path: string) {
    const base = `chrome-extension://${this.api.runtime.id}/`
    return new URL(path, base).href
  }

  private async 'permissions.request'(opts: chrome.permissions.Permissions) {
    // Check if permissions are already granted
    const alreadyGranted = await this.api.permissions.contains(opts)
    if (alreadyGranted) return true

    // Prepare permission url
    const url = this.api.runtime.getURL(this.$.env.url.system({ type: 'permission' }))

    // Close all permission tabs
    const tabs = await this.api.tabs.query({ url })
    await Promise.all(tabs.map(tab => tab.id && this.api.tabs.remove(tab.id)))

    // Create new permission tab and wait till it is ready for requesting
    await this.api.tabs.create({ url, active: false, pinned: true })
    await this.bus.waitSignal('App.ready[system:permission]')

    // Request permissions
    const request = this.bus.send<PermissionResult>('requestPermissions', opts)
    const [result, error] = await this.$.utils.safe(request)

    // Close permission tab
    await this.bus.send('closePermissionTab')

    // Error? -> Throw
    if (error) throw error

    // Update API object as new APIs might be added
    if (!result) throw this.never()
    if (result.granted) await this.initApi()

    return result
  }
}
