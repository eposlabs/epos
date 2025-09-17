import type { Options, Location } from '../../store/state/state.ex.sw'

export class PkgApiStore extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!

  symbols = {
    init: $exSw.State._init_,
    cleanup: $exSw.State._cleanup_,
    versioner: $exSw.State._versioner_,
    parent: $exSw.State._parent_,
  }

  async connect(...args: unknown[]) {
    const [name, options] = this.parseConnectArgs(args)
    const location = this.getLocation(name)
    return await this.$.store.connect(location, options)
  }

  async disconnect(name?: string) {
    this.validateName(name)
    const location = this.getLocation(name)
    await this.$.store.disconnect(location)
  }

  transaction(fn: () => void) {
    this.validateTransactionFn(fn)
    this.$.store.transaction(fn)
  }

  local(state: Obj = {}) {
    this.validateLocalState(state)
    throw new Error('Not implemented yet')
  }

  async list(opts: { connected?: boolean } = {}) {
    const names = await this.$.idb.keys(this.$pkg.name, ':state')
    return names
      .map(name => ({
        name: name === ':default' ? null : name,
        connected: this.$.store.isConnected([this.$pkg.name, ':state', name]),
      }))
      .filter(state => {
        if (this.$.is.undefined(opts.connected)) return true
        return opts.connected === state.connected
      })
  }

  async destroy(name?: string) {
    this.validateName(name)
    const location = this.getLocation(name)
    await this.$.store.destroy(location)
  }

  private parseConnectArgs(args: unknown[]): [undefined | string, undefined | Options] {
    if (args.length === 0) {
      return [undefined, undefined]
    }

    if (args.length === 1) {
      if (this.$.is.string(args[0])) {
        const [name] = args
        this.validateName(name)
        return [name, undefined]
      } else {
        const [options] = args
        this.validateOptions(options)
        return [undefined, options]
      }
    }

    if (args.length === 2) {
      const [name, options] = args
      this.validateName(name)
      this.validateOptions(options)
      return [name, options]
    }

    throw new Error('Invalid number of arguments, 0-2 expected')
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

  private validateOptions(options: unknown): asserts options is undefined | Options {
    if (this.$.is.undefined(options)) return
    if (!this.$.is.object(options)) throw new Error('Invalid options, object expected')
    this.validateInitial(options.initial)
    this.validateModels(options.models)
    this.validateVersioner(options.versioner)
  }

  private validateInitial(initial: unknown) {
    if (this.$.is.undefined(initial)) return
    if (!this.$.is.function(initial)) throw new Error('Invalid "initial" field, function expected')
  }

  private validateModels(models: unknown) {
    if (this.$.is.undefined(models)) return
    if (this.$.is.map(models)) return
    if (this.$.is.object(models)) return
    throw new Error('Invalid "models" field, object or Map expected')
  }

  private validateVersioner(versioner: unknown) {
    if (this.$.is.undefined(versioner)) return
    if (!this.$.is.object(versioner)) throw new Error('Invalid "versioner" field, object expected')

    const keys = Object.keys(versioner)
    const badKey = keys.find(key => !this.$.is.numeric(key))
    if (badKey) throw new Error(`Invalid "versioner" field, keys must be numeric, but got: "${badKey}"`)

    const badValueKey = keys.find(key => !this.$.is.function(versioner[key]))
    if (badValueKey)
      throw new Error(`Invalid "versioner" field, value for key "${badValueKey}" must be a function`)
  }

  private validateTransactionFn(fn: Fn) {
    if (!this.$.is.function(fn)) throw new Error('Invalid transaction argument, function expected')
  }

  private validateLocalState(state: unknown) {
    if (!this.$.is.object(state)) throw new Error('Invalid state, object expected')
  }
}
