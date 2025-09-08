import type { PermissionResult } from './kit-browser.sm'

const _id_ = Symbol('id')

export type Root = typeof chrome
export type Callback = Fn & { [_id_]?: string }

export class KitBrowserApi extends $ex.Unit {
  root!: Root
  // @ts-ignore
  private scope: string
  private listenerIds = new Set<string>()
  static _id_ = _id_

  static async create(parent: $ex.Unit, scope: string) {
    const api = new KitBrowserApi(parent, scope)
    await api.init()
    return api
  }

  constructor(parent: $ex.Unit, scope: string) {
    super(parent)
    this.scope = scope
  }

  private async init() {
    this.root = await this.createRoot()
  }

  private async createRoot() {
    const tree = await this.$.bus.send<Obj>('kit.browser.getApiTree')
    return this.build(tree) as Root
  }

  private build(value: any, path: string[] = []) {
    if (this.$.is.object(value)) {
      const api: Obj = {}
      for (const key in value) api[key] = this.build(value[key], [...path, key])
      return api
    }

    if (this.$.is.string(value) && value.startsWith('<')) {
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

  // ---------------------------------------------------------------------------
  // MANAGE LISTENERS
  // ---------------------------------------------------------------------------

  private addListener(apiPath: string[], cb?: Callback) {
    if (!cb) return
    cb[_id_] ??= this.$.utils.id()

    const listenerId = this.buildListenerId(apiPath, cb)
    if (this.listenerIds.has(listenerId)) return

    this.listenerIds.add(listenerId)
    this.$.bus.on(`kit.browser.listener[${listenerId}]`, cb)
    async: this.$.bus.send('kit.browser.registerListener', this.$.peer.id, listenerId, apiPath)
  }

  private hasListener(apiPath: string[], cb: Callback) {
    if (!cb || !cb[_id_]) return false
    const listenerId = this.buildListenerId(apiPath, cb)
    return this.listenerIds.has(listenerId)
  }

  private hasListeners(apiPath: string[]) {
    const prefix = this.buildListenerIdPrefix(apiPath)
    return [...this.listenerIds].some(id => id.startsWith(prefix))
  }

  private removeListener(apiPath: string[], cb: Callback) {
    if (!cb || !cb[_id_]) return

    const listenerId = this.buildListenerId(apiPath, cb)
    if (!this.listenerIds.has(listenerId)) return

    this.$.bus.off(`kit.browser.listener[${listenerId}]`)
    this.listenerIds.delete(listenerId)
    async: this.$.bus.send('kit.browser.unregisterListener', listenerId)
  }

  private buildListenerId(apiPath: string[], cb: Callback) {
    return `${apiPath.join('.')}[${cb[_id_]}]`
  }

  private buildListenerIdPrefix(apiPath: string[]) {
    return `${apiPath.join('.')}[`
  }

  // ---------------------------------------------------------------------------
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
    //   return this.$.bus.send('kit.browser.updateSessionRules', options)
    // } else if (getter === 'declarativeNetRequest.updateDynamicRules') {
    //   const options = args[0] as UpdateRuleOptions
    //   return this.$.bus.send('kit.browser.updateDynamicRules', options)
    // }

    // Call method via [sw]
    return this.$.bus.send('kit.browser.callMethod', apiPath, methodName, ...args)
  }

  // ---------------------------------------------------------------------------
  // BROWSER API OVERWRITES
  // ---------------------------------------------------------------------------

  private 'runtime.getURL'(path: string) {
    if (!this.root) throw this.never
    const base = `chrome-extension://${this.root.runtime.id}/`
    return new URL(path, base).href
  }

  private async 'permissions.request'(opts: chrome.permissions.Permissions) {
    const root = this.root
    if (!root) throw this.never

    // Check if permissions are already granted
    const alreadyGranted = await root.permissions.contains(opts)
    if (alreadyGranted) return true

    // Prepare permission url
    const url = root.runtime.getURL(this.$.env.url.system({ type: 'permission' }))

    // Close all permission tabs
    const tabs = await root.tabs.query({ url })
    await Promise.all(tabs.map(tab => tab.id && root.tabs.remove(tab.id)))

    // Create new permission tab and wait till it is ready for requesting
    await root.tabs.create({ url, active: false, pinned: true })
    await this.$.bus.waitSignal('app.ready[system:permission]')

    // Request permissions
    const request = this.$.bus.send<PermissionResult>('kit.browser.requestPermissions', opts)
    const [result, error] = await this.$.utils.safe(request)

    // Close permission tab
    await this.$.bus.send('kit.browser.closePermissionTab')

    // Error? -> Throw
    if (error) throw error

    // Update API object as new APIs might be added
    if (result.granted) Object.assign(root, await this.createRoot())

    return result
  }
}
