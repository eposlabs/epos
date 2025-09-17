export class PkgApiBus extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!
  private bus = this.$.bus.create(`pkg[${this.$pkg.name}]`)

  on(name: string, fn: Fn, thisValue?: unknown) {
    this.validateName(name)
    this.validateFn(fn)
    this.bus.on(name, fn, thisValue)
  }

  off(name: string, fn?: Fn) {
    this.validateName(name)
    this.validateFn(fn, true)
    this.bus.off(name, fn)
  }

  once(name: string, fn: Fn, thisValue?: unknown) {
    this.validateName(name)
    this.validateFn(fn)
    this.bus.once(name, fn, thisValue)
  }

  async send(name: string, ...args: unknown[]) {
    this.validateName(name)
    return await this.bus.send(name, ...args)
  }

  async emit(name: string, ...args: unknown[]) {
    this.validateName(name)
    return await this.bus.emit(name, ...args)
  }

  private validateName(name: string) {
    if (!this.$.is.string(name)) throw new Error('Invalid event name, string expected')
    if (name.length === 0) throw new Error('Invalid event name, non-empty string expected')
  }

  private validateFn(fn: Fn | undefined, optional = false) {
    if (optional && this.$.is.undefined(fn)) return
    if (!this.$.is.function(fn)) throw new Error('Invalid event handler, function expected')
  }
}
