import type { Initial, Location, Versioner } from '../../states/state/state.ex.sw'

export class PkgApiState extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!

  connect = async (...args: unknown[]) => {
    const [name, initial, versioner] = this.parseConnectArgs(args)
    const location = this.getLocation(name)

    return await this.$.states.connect(location, {
      initial: initial,
      versioner: versioner,
      unitScope: this.$pkg.name,
    })
  }

  disconnect = async (name?: string) => {
    this.validateName(name)
    const location = this.getLocation(name)
    await this.$.states.disconnect(location)
  }

  transaction = (fn: Fn) => {
    this.validateTransactionFn(fn)
    this.$.states.transaction(fn)
  }

  local = (state: Obj = {}) => {
    this.validateState(state)
    return this.$.states.local.create(state)
    return this.$.libs.mobx.observable(state)
  }

  states = async (opts: { connected?: boolean } = {}) => {
    const names = await this.$.idb.keys(this.$pkg.name, ':state')
    return names
      .map(name => ({
        name: name === ':default' ? null : name,
        connected: this.$.states.isConnected([this.$pkg.name, ':state', name]),
      }))
      .filter(state => {
        if (this.$.is.undefined(opts.connected)) return true
        return opts.connected === state.connected
      })
  }

  destroy = async (name?: string) => {
    this.validateName(name)
    const location = this.getLocation(name)
    await this.$.states.destroy(location)
  }

  private parseConnectArgs(
    args: unknown[],
  ): [undefined | string, undefined | Initial, undefined | Versioner] {
    if (args.length === 0) {
      return [undefined, undefined, undefined]
    }

    if (args.length === 1) {
      if (this.$.is.string(args[0])) {
        const [name] = args
        this.validateName(name)
        return [name, undefined, undefined]
      } else {
        const [initial] = args
        this.validateInitial(initial)
        return [undefined, initial, undefined]
      }
    }

    if (args.length === 2) {
      if (this.$.is.string(args[0])) {
        const [name, initial] = args
        this.validateName(name)
        this.validateInitial(initial)
        return [name, initial, undefined]
      } else {
        const [initial, versioner] = args
        this.validateInitial(initial)
        this.validateVersioner(versioner)
        return [undefined, initial, versioner]
      }
    }

    if (args.length === 3) {
      const [name, initial, versioner] = args
      this.validateName(name)
      this.validateInitial(initial)
      this.validateVersioner(versioner)
      return [name, initial, versioner]
    }

    throw new Error('Invalid number of arguments, 0-3 expected')
  }

  private getLocation(name: undefined | string): Location {
    if (this.$.is.undefined(name)) {
      return [this.$pkg.name, ':state', ':default']
    } else {
      return [this.$pkg.name, ':state', name]
    }
  }

  private validateName(name: unknown): asserts name is undefined | string {
    if (this.$.is.undefined(name)) return
    if (!this.$.is.string(name)) throw new Error('Invalid state name, string expected')
    if (name.length === 0) throw new Error('Invalid state name, non-empty string expected')
    if (name.startsWith(':')) throw new Error('Invalid state name, cannot start with ":"')
  }

  private validateInitial(initial: unknown): asserts initial is undefined | Fn {
    if (this.$.is.undefined(initial)) return
    if (!this.$.is.function(initial)) throw new Error('Invalid state initializer, function expected')
  }

  private validateVersioner(versioner?: unknown): asserts versioner is undefined | Versioner {
    if (this.$.is.undefined(versioner)) return
    if (!this.$.is.object(versioner)) throw new Error('Invalid versioner, object expected')

    const keys = Object.keys(versioner)
    const badKey = keys.find(key => !this.$.is.numeric(key))
    if (badKey) throw new Error(`Invalid versioner, keys must be numeric, but got: "${badKey}"`)

    const badValueKey = keys.find(key => !this.$.is.function(versioner[key]))
    if (badValueKey) throw new Error(`Invalid versioner, value for key "${badValueKey}" must be a function`)
  }

  private validateTransactionFn(fn: Fn) {
    if (!this.$.is.function(fn)) throw new Error('Invalid transaction argument, function expected')
  }

  private validateState(state: unknown) {
    if (!this.$.is.object(state)) throw new Error('Invalid state, object expected')
  }
}
