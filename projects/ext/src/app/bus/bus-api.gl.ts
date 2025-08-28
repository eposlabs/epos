export class BusApi extends $gl.Unit {
  private $bus = this.up($gl.Bus, 'internal')!
  id?: string

  constructor(parent: $gl.Unit, id?: string) {
    super(parent)
    this.id = id
  }

  on(name: string, fn: Fn, thisValue?: unknown) {
    const fullName = this.toFullName(name)
    this.$bus.actions.register({ name: fullName, fn, this: thisValue })
  }

  off(name: string, fn?: Fn) {
    const fullName = this.toFullName(name)
    this.$bus.actions.unregister({ name: fullName, fn })
  }

  once(name: string, fn: Fn, thisValue?: unknown) {
    const handler = (...args: unknown[]) => {
      this.off(name, handler)
      return fn(...args)
    }

    this.on(name, handler, thisValue)
  }

  async send<T = unknown>(name: string, ...args: unknown[]): Promise<T> {
    const fullName = this.toFullName(name)

    let result
    if (this.$bus.is('exFrame')) {
      result = await this.$bus.page.sendToParent(fullName, ...args)
    } else if (this.$bus.is('exTab')) {
      result = await this.$bus.page.send(fullName, ...args)
    } else if (this.$bus.is('cs', 'os', 'vw', 'sw')) {
      result = await this.$bus.utils.pick([
        this.$bus.ext.send(fullName, ...args),
        this.$bus.proxy.call(fullName, ...args),
      ])
    }

    if (this.$bus.utils.isThrow(result)) {
      const error = new Error(result.message)
      Error.captureStackTrace(error, this.send)
      throw error
    }

    return result as T
  }

  async emit<T = unknown>(name: string, ...args: unknown[]): Promise<T> {
    const fullName = this.toFullName(name)
    const actions = this.$bus.actions.list.filter(a => a.name === fullName && !a.proxy)
    const promises = actions.map(async a => a.fn.call(a.this, ...args))
    const result = await this.$bus.utils.pick(promises)
    return result as T
  }

  setSignal(name: string, ...args: unknown[]) {
    const value = args[0] ?? true
    this.on(name, () => value)
    async: this.send(name, value)
  }

  async waitSignal(name: string, timeout?: number) {
    // Setup listener
    const listener$ = Promise.withResolvers<unknown>()
    const listener = (v: unknown) => listener$.resolve(v)
    this.on(name, listener)

    // Setup timer
    const timer$ = Promise.withResolvers<false>()
    let timer: number | null = null
    if (timeout) timer = self.setTimeout(() => timer$.resolve(false), timeout)

    // Wait for signal or timer
    const result = await this.$bus.utils.pick([
      this.send(name),
      listener$.promise,
      timer$.promise,
    ])

    // Cleanup
    this.off(name, listener)
    if (timer) self.clearTimeout(timer)

    return result
  }

  private toFullName(name: string) {
    if (!this.id) return name
    return `{${this.id}}:${name}`
  }
}
