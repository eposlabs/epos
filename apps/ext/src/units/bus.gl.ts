import type { Target } from './bus-action.gl'

export type FnArgsOrArr<T> = T extends Fn ? Parameters<T> : Arr
export type FnResultOrValue<T> = T extends Fn ? ReturnType<T> : T

export class Bus extends gl.Unit {
  // Different epos-based apps have different appId
  appId = '' // this.$.env.is.sw ? this.$.utils.id() : '' // TODO: null
  // Different peers of the same app have different peerId
  peerId = this.$.utils.id()
  // Registered actions
  actions: gl.BusAction[] = []

  utils = new gl.BusUtils(this)
  serializer = new gl.BusSerializer(this)

  extBridge = new gl.BusExtBridge(this)
  pageBridge = new gl.BusPageBridge(this)

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

  off<T extends Fn>(name?: string, fn?: T | null, target?: Target) {
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

    if (this.$.env.is.sw || this.$.env.is.csTop || this.$.env.is.os || this.$.env.is.vw) {
      result = await this.utils.pick([
        this.extBridge.send(name, ...args),
        this.executeProxyActions(name, ...args),
      ])
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
    name = `signal[${name}]`
    this.on(name, () => value)
    void this.send(name, value)
  }

  async waitSignal<T>(name: string, timeout?: number) {
    name = `signal[${name}]`

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

  use(namespace: string) {
    const prefix = `@${namespace}::`
    const prefixed = (name: string) => `${prefix}${name}`

    const offAll = () => {
      const prefixedActions = this.actions.filter(action => action.name.startsWith(prefix))
      prefixedActions.forEach(action => this.off(action.name, action.fn, action.target))
    }

    return {
      on: <T extends Fn>(name: string, fn: T, thisArg?: unknown) => {
        this.on<T>(prefixed(name), fn, thisArg)
      },
      off: <T extends Fn>(name?: string, fn?: T) => {
        if (this.$.utils.is.undefined(name)) return offAll()
        this.off<T>(prefixed(name), fn)
      },
      send: async <T>(name: string, ...args: FnArgsOrArr<T>) => {
        return await this.send<T>(prefixed(name), ...args)
      },
      emit: async <T>(name: string, ...args: FnArgsOrArr<T>) => {
        return await this.emit<T>(prefixed(name), ...args)
      },
      once: <T extends Fn>(name: string, fn: T, thisArg?: unknown) => {
        this.once<T>(prefixed(name), fn, thisArg)
      },
      setSignal: (name: string, ...args: unknown[]) => {
        this.setSignal(prefixed(name), ...args)
      },
      waitSignal: async <T>(name: string, timeout?: number) => {
        return await this.waitSignal<T>(prefixed(name), timeout)
      },
    }
  }

  async getTabData() {
    if (!this.$.env.is.cs) throw this.never()
    const tabId = await this.extBridge.send<number | null>('Bus.getTabId')
    return { tabId, tabBusToken: 'xxx' }
  }

  private async executeProxyActions(name: string, ...args: unknown[]) {
    const actions = this.actions.filter(action => action.name === name && action.target)
    return await this.utils.pick(actions.map(action => action.execute(...args)))
  }
}
