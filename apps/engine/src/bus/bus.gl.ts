import type { Rpc, RpcTarget } from 'epos'
import type { Target } from './bus-action.gl'

export type FnArgsOrArr<T> = T extends Fn ? Parameters<T> : Arr
export type FnResultOrValue<T> = T extends Fn ? ReturnType<T> : T
export type CsTabInfo = TabInfo & { pageToken: string | null }

export class Bus extends gl.Unit {
  peerId = this.$.utils.generateId()
  pageToken: string | null = null // For secure `cs` <-> `ex` communication
  actions: gl.BusAction[] = [] // Registered actions
  utils = new gl.BusUtils(this)
  rpcNames = new Set<string>()
  serializer = new gl.BusSerializer(this)
  extBridge = new gl.BusExtBridge(this)
  pageBridge = new gl.BusPageBridge(this)

  async initPageToken() {
    const isCsOrEx = this.$.env.is.cs || this.$.env.is.ex
    if (!isCsOrEx) throw this.never()

    if (this.$.env.is.csTop) {
      this.pageToken = this.$.utils.generateId()
    } else if (this.$.env.is.csFrame) {
      this.pageToken = await this.extBridge.send<string | null>('Bus.getPageToken')
    } else if (this.$.env.is.ex && !this.$.env.is.exExtension) {
      const pageToken = self.__eposBusPageToken
      delete self.__eposBusPageToken
      if (this.$.utils.is.undefined(pageToken)) throw new Error('Page token is not passed to `ex`')
      this.pageToken = pageToken
    }
  }

  on<T extends Fn = Fn>(name: string, fn: T, thisArg?: unknown, target?: Target) {
    if (!fn) return

    // Register proxy action:
    // - `csTop` -> `sw`
    // - `csFrame` and `ex` -> `csTop` for tabs, `os` for offscreen and `vw` for popup and side panel
    if (this.$.env.is.cs || this.$.env.is.ex) {
      const actions = this.actions.filter(action => action.name === name)
      if (actions.length === 0) {
        if (this.$.env.is.csTop) {
          void this.extBridge.send('Bus.registerTabProxyAction', name)
        } else {
          void this.pageBridge.sendToTop('Bus.registerContextProxyAction', name)
        }
      }
    }

    // Add action
    const action = new gl.BusAction(this, name, fn, thisArg, target)
    this.actions.push(action)
  }

  off<T extends Fn>(name: string, fn?: T | null, target?: Target) {
    // Remove matching actions
    this.actions = this.actions.filter(action => {
      const nameMatches = action.name === name
      const fnMatches = !fn || action.fn === fn
      const targetMatches = target ? action.target === target : !action.target
      if (nameMatches && fnMatches && targetMatches) return false
      return true
    })

    // Remove proxy action
    if (this.$.env.is.cs || this.$.env.is.ex) {
      const actions = this.actions.filter(action => action.name === name)
      if (actions.length === 0) {
        if (this.$.env.is.csTop) {
          void this.extBridge.send('Bus.removeTabProxyAction', name)
        } else {
          void this.pageBridge.sendToTop('Bus.removeContextProxyAction', name)
        }
      }
    }
  }

  async send<T>(name: string, ...args: FnArgsOrArr<T>) {
    let result: unknown

    if (this.$.env.is.csTop || this.$.env.is.os || this.$.env.is.pm || this.$.env.is.sw || this.$.env.is.vw) {
      result = await this.utils.pick([this.extBridge.send(name, ...args), this.executeProxyActions(name, ...args)])
    } else if (this.$.env.is.csFrame || this.$.env.is.ex) {
      result = await this.pageBridge.sendToTop(name, ...args)
    }

    if (this.utils.isThrowObject(result)) {
      const error = new Error(result.message)
      Error.captureStackTrace(error, this.send)
      throw error
    }

    return result as FnResultOrValue<T> | null
  }

  async emit<T>(name: string, ...args: FnArgsOrArr<T>) {
    const actions = this.actions.filter(action => action.name === name && !action.target)
    const result = await this.utils.pick(actions.map(action => action.execute(...args)))
    return result as FnResultOrValue<T> | null
  }

  once<T extends Fn>(name: string, fn: T, thisArg?: unknown) {
    // Create one-time handler
    const handler = async (...args: unknown[]) => {
      this.off(name, handler)
      return await fn(...args)
    }

    // Register one-time handler
    this.on(name, handler, thisArg)
  }

  setSignal(name: string, value: unknown = true) {
    name = `Bus.signal[${name}]`
    this.on(name, () => value)
    void this.send(name, value)
  }

  async waitSignal<T>(name: string, timeout?: number) {
    name = `Bus.signal[${name}]`

    // Setup listener
    const listener$ = Promise.withResolvers<unknown>()
    const listener = (value: unknown) => listener$.resolve(value)
    this.on(name, listener)

    // Setup timer if timeout is specified
    const timer$ = Promise.withResolvers<null>()
    let timer: number | null = null
    if (timeout) timer = setTimeout(() => timer$.resolve(null), timeout)

    // Wait for the signal or timer
    const result = await this.utils.pick([this.send(name), listener$.promise, timer$.promise])

    // Cleanup
    this.off(name, listener)
    if (timer) clearTimeout(timer)

    return result as T | null
  }

  register(name: string, api: RpcTarget) {
    if (this.rpcNames.has(name)) return
    this.rpcNames.add(name)

    this.on(`Bus.rpc[${name}]`, (key: string, ...args: unknown[]) => {
      const fn: unknown = api[key]
      if (!this.$.utils.is.function(fn)) throw new Error(`Method not found: '${key}'`)
      return fn.call(api, ...args)
    })
  }

  unregister(name: string) {
    if (!this.rpcNames.has(name)) return
    this.rpcNames.delete(name)
    this.off(`Bus.rpc[${name}]`)
  }

  use<T extends RpcTarget>(name: string) {
    const target = {}
    return new Proxy(target, {
      get: (_, key: string) => {
        return (...args: unknown[]) => this.send(`Bus.rpc[${name}]`, key, ...args)
      },
    }) as Rpc<T>
  }

  for(namespace: string) {
    const prefix = `@${namespace}_`
    const prefixed = (name: string) => `${prefix}${name}`
    let disposed = false

    return {
      on: <T extends Fn>(name: string, fn: T, thisArg?: unknown) => {
        if (disposed) return
        this.on<T>(prefixed(name), fn, thisArg)
      },
      off: <T extends Fn>(name: string, fn?: T) => {
        if (disposed) return
        this.off<T>(prefixed(name), fn)
      },
      send: async <T>(name: string, ...args: FnArgsOrArr<T>) => {
        if (disposed) return null
        return await this.send<T>(prefixed(name), ...args)
      },
      emit: async <T>(name: string, ...args: FnArgsOrArr<T>) => {
        if (disposed) return null
        return await this.emit<T>(prefixed(name), ...args)
      },
      once: <T extends Fn>(name: string, fn: T, thisArg?: unknown) => {
        if (disposed) return
        this.once<T>(prefixed(name), fn, thisArg)
      },
      setSignal: (name: string, ...args: unknown[]) => {
        if (disposed) return
        this.setSignal(prefixed(name), ...args)
      },
      waitSignal: async <T>(name: string, timeout?: number) => {
        if (disposed) return null
        return await this.waitSignal<T>(prefixed(name), timeout)
      },
      register: (id: string, api: RpcTarget) => {
        if (disposed) return
        this.register(prefixed(id), api)
      },
      unregister: (id: string) => {
        if (disposed) return
        this.unregister(prefixed(id))
      },
      use: <T extends RpcTarget>(id: string) => {
        if (disposed) throw new Error('Cannot call `use` on disposed Bus')
        return this.use<T>(prefixed(id))
      },
      dispose: () => {
        if (disposed) return
        disposed = true
        const actions = this.actions.filter(action => action.name.startsWith(prefix))
        actions.forEach(action => this.off(action.name, action.fn, action.target))
      },
    }
  }

  async csGetTabInfo(): Promise<CsTabInfo> {
    if (!this.$.env.is.cs) throw this.never()

    let tabInfo: TabInfo
    if (this.$.env.is.csTop) {
      const result = await this.extBridge.send<TabInfo>('Bus.getTabInfo')
      if (!result) throw this.never()
      tabInfo = result
    } else if (this.$.env.is.csFrame) {
      tabInfo = { tabId: -1, windowId: -1 }
    } else {
      throw this.never()
    }

    return { ...tabInfo, pageToken: this.pageToken }
  }

  private async executeProxyActions(name: string, ...args: unknown[]) {
    const actions = this.actions.filter(action => action.name === name && action.target)
    return await this.utils.pick(actions.map(action => action.execute(...args)))
  }
}
