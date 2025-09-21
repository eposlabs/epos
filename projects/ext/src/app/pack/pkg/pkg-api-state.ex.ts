import type { Location, ModelClass, Options } from '../../store/state/state.ex.sw'

export class PkgApiState extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!
  private states: { [name: string]: $exSw.State } = {}

  symbols = {
    model: {
      init: $exSw.State._init_,
      cleanup: $exSw.State._cleanup_,
      versioner: $exSw.State._versioner_,
      parent: $exSw.State._parent_,
    },
  }

  async connect(name?: string, options?: Options): Promise<Obj>
  async connect(options?: Options): Promise<Obj>
  async connect(...args: unknown[]) {
    let name: string | undefined
    let options: Options | undefined
    if (args.length === 1) {
      if (this.$.is.string(args[0])) {
        name = args[0] as string
      } else if (this.$.is.object(args[0])) {
        options = args[0] as Options
      }
    } else if (args.length >= 2) {
      name = args[0] as string
      options = args[1] as Options
    }

    name = this.prepareName(name)
    const location = this.getLocation(name)
    this.states[name] = await this.$.store.connect(location, options)
    return this.states[name].data
  }

  async disconnect(name?: string) {
    name = this.prepareName(name)
    const location = this.getLocation(name)
    await this.$.store.disconnect(location)
    delete this.states[name]
  }

  async remove(name?: string) {
    name = this.prepareName(name)
    const location = this.getLocation(name)
    await this.$.store.remove(location)
    delete this.states[name]
  }

  local(state: Obj = {}) {
    throw new Error('Not implemented yet')
    return state
  }

  transaction(fn: () => void) {
    this.$.store.transaction(fn)
  }

  async list(opts: { connected?: boolean } = {}) {
    const names = await this.$.idb.keys(this.$pkg.name, ':store')
    return names
      .map(name => ({
        name: name === ':default' ? null : name,
        connected: this.$.store.isConnected([this.$pkg.name, ':store', name]),
      }))
      .filter(state => {
        if (this.$.is.undefined(opts.connected)) return true
        return opts.connected === state.connected
      })
  }

  registerGlobalModels(models: Record<string, ModelClass>) {
    Object.values(this.states).forEach(state => state.registerModels(models))
  }

  private getLocation(name: string): Location {
    return [this.$pkg.name, ':store', name]
  }

  private prepareName(name?: string) {
    if (this.$.is.absent(name)) return ':default'
    if (name === '') throw new Error('Store name cannot be empty string')
    if (name.startsWith(':')) throw new Error(`Store name cannot start with ':'`)
    return name
  }
}
