import type { Target } from './bus-action.gl'

export class Bus extends gl.Unit {
  id = this.$.utils.id()
  actions: gl.BusAction[] = []
  token = this.$.env.is.sw ? this.$.utils.id() : null

  utils = new gl.BusUtils(this)
  serializer = new gl.BusSerializer(this)

  extBridge = new gl.BusExtBridge(this)
  pageBridge = new gl.BusPageBridge(this)

  create(scope: string) {
    const scoped = (name: string) => `{${scope}}:${name}`
    return {
      on: (name: string, fn: Fn, thisValue?: unknown) => this.on(scoped(name), fn, thisValue),
      off: (name: string, fn?: Fn) => this.off(scoped(name), fn),
      send: <T>(name: string, ...args: unknown[]) => this.send<T>(scoped(name), ...args),
      emit: <T>(name: string, ...args: unknown[]) => this.emit<T>(scoped(name), ...args),
      once: (name: string, fn: Fn, thisValue?: unknown) => this.once(scoped(name), fn, thisValue),
      setSignal: (name: string, ...args: unknown[]) => this.setSignal(scoped(name), ...args),
      waitSignal: (name: string, timeout?: number) => this.waitSignal(scoped(name), timeout),
    }
  }

  on(name: string, fn: Fn, thisValue?: unknown, target?: Target) {
    if (!fn) return

    // Register proxy action:
    // - [csTop] -> [sw]
    // - [csFrame] and [ex] -> [csTop] for tabs, [os] for offscreen and [vw] for popup and side panel
    if (this.$.env.is.cs || this.$.env.is.ex) {
      const actions = this.actions.filter(action => action.name === name)
      if (actions.length === 0) {
        if (this.$.env.is.csTop) {
          async: this.extBridge.send('bus.registerProxyAction', name)
        } else {
          async: this.pageBridge.sendToTop('bus.registerProxyAction', name)
        }
      }
    }

    // Add action
    const action = new gl.BusAction(this, name, fn, thisValue, target)
    this.actions.push(action)
  }

  off(name: string, fn?: Fn, target?: Target) {
    // Remove matching actions
    this.actions = this.actions.filter(action => {
      const nameMatches = action.name === name
      const fnMatches = !fn || action.fn === fn
      const targetMatches = target ? action.target === target : !action.target
      if (nameMatches && fnMatches && targetMatches) return false
      return true
    })

    // Unregister proxy action
    if (this.$.env.is.cs || this.$.env.is.ex) {
      const actions = this.actions.filter(action => action.name === name)
      if (actions.length === 0) {
        if (this.$.env.is.csTop) {
          async: this.extBridge.send('bus.unregisterProxyAction', name)
        } else {
          async: this.pageBridge.sendToTop('bus.unregisterProxyAction', name)
        }
      }
    }
  }

  async send<T = unknown>(name: string, ...args: unknown[]): Promise<T> {
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

    return result as T
  }

  async emit<T = unknown>(name: string, ...args: unknown[]): Promise<T> {
    const actions = this.actions.filter(action => action.name === name && !action.target)
    const result = await this.utils.pick(actions.map(action => action.execute(...args)))
    return result as T
  }

  once(name: string, fn: Fn, thisValue?: unknown) {
    // Create one-time handler
    const handler = async (...args: unknown[]) => {
      this.off(name, handler)
      return await fn(...args)
    }

    // Register one-time handler
    this.on(name, handler, thisValue)
  }

  setSignal(name: string, value: unknown = true) {
    name = `signal[${name}]`
    this.on(name, () => value)
    async: this.send(name, value)
  }

  async waitSignal(name: string, timeout?: number) {
    name = `signal[${name}]`

    // Setup listener
    const listener$ = Promise.withResolvers<unknown>()
    const listener = (value: unknown) => listener$.resolve(value)
    this.on(name, listener)

    // Setup timer
    const timer$ = Promise.withResolvers<false>()
    let timer: number | null = null
    if (timeout) timer = self.setTimeout(() => timer$.resolve(false), timeout)

    // Wait for the signal or timer
    const result = await this.utils.pick([this.send(name), listener$.promise, timer$.promise])

    // Cleanup
    this.off(name, listener)
    if (timer) self.clearTimeout(timer)

    return result
  }

  private async executeProxyActions(name: string, ...args: unknown[]) {
    const actions = this.actions.filter(action => action.name === name && action.target)
    return await this.utils.pick(actions.map(action => action.execute(...args)))
  }
}
