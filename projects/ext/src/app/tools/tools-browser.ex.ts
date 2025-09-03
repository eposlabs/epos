import type { PermissionResult } from './tools-browser.sm'

const _id_ = Symbol('id')

export type Callback = Fn & { [_id_]?: string }

export class ToolsBrowser extends $ex.Unit {
  api: typeof chrome | null = null
  private listenerIds = new Set<string>()
  static _id_ = _id_

  async init() {
    this.api = await this.createApi()
  }

  private async createApi() {
    const apiTree = await this.$.bus.send('tools.getApiTree')
    if (!this.$.is.object(apiTree)) throw this.never
    return this.buildApi(apiTree) as typeof chrome
  }

  private buildApi(value: any, path: string[] = []) {
    if (this.$.is.object(value)) {
      const api: Obj = {}
      for (const key in value) {
        api[key] = this.buildApi(value[key], [...path, key])
      }
      return api
    }

    if (this.$.is.string(value) && value.startsWith('<')) {
      const apiPath = path.slice(0, -1)
      if (value === '<method>') {
        const methodName = path.at(-1) as string
        return this.callMethod.bind(this, apiPath, methodName)
      } else if (value === '<addListener>') {
        const apiPath = path.slice(0, -1)
        return this.addListener.bind(this, apiPath)
      } else if (value === '<hasListener>') {
        return this.hasListener.bind(this, apiPath)
      } else if (value === '<hasListeners>') {
        return this.hasListeners.bind(this, apiPath)
      } else if (value === '<removeListener>') {
        return this.removeListener.bind(this, apiPath)
      }
    }

    return value
  }

  // ---------------------------------------------------------------------------
  // CALL METHOD
  // ---------------------------------------------------------------------------

  // ! Do not make this method async, 'runtime.getURL' must be sync
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

    // Call method via SW
    return this.$.bus.send('tools.callMethod', apiPath, methodName, ...args)
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
    this.$.bus.on(`ext.listener[${listenerId}]`, cb)
    async: this.$.bus.send('tools.registerListener', this.$.peer.id, listenerId, apiPath)
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

    this.$.bus.off(`tools.listener[${listenerId}]`)
    this.listenerIds.delete(listenerId)
    async: this.$.bus.send('tools.unregisterListener', listenerId)
  }

  private buildListenerId(apiPath: string[], cb: Callback) {
    return `${apiPath.join('.')}[${cb[_id_]}]`
  }

  private buildListenerIdPrefix(apiPath: string[]) {
    return `${apiPath.join('.')}[`
  }

  // ---------------------------------------------------------------------------
  // runtime.getURL
  // ---------------------------------------------------------------------------

  private 'runtime.getURL'(path: string) {
    if (!this.api) throw this.never
    const base = `chrome-extension://${this.api.runtime.id}/`
    return new URL(path, base).href
  }

  // ---------------------------------------------------------------------------
  // permissions.request
  // ---------------------------------------------------------------------------

  private async 'permissions.request'(opts: chrome.permissions.Permissions) {
    const api = this.api
    if (!api) throw this.never

    // Check if permissions are already granted
    const alreadyGranted = await api.permissions.contains(opts)
    if (alreadyGranted) return true

    // Prepare permission url
    const url = api.runtime.getURL(this.$.env.url.system('permission'))

    // Close all permission tabs
    const tabs = await api.tabs.query({ url })
    await Promise.all(tabs.map(tab => tab.id && api.tabs.remove(tab.id)))

    // Create new permission tab and wait till it is ready for requesting
    await api.tabs.create({ url, active: false, pinned: true })
    await this.$.bus.waitSignal('app.ready[system:permission]')

    // Request permissions
    const request = this.$.bus.send<PermissionResult>('tools.requestPermissions', opts)
    const [result, error] = await this.$.utils.safe(request)

    // Close permission tab
    await this.$.bus.send('tools.closePermissionTab')

    // Error? -> Throw
    if (error) throw error

    // Update API object as new APIs might be added
    if (result.granted) Object.assign(api, await this.createApi())

    return result
  }
}
