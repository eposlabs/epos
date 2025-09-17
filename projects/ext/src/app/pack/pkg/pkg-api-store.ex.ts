import type { Options, Location } from '../../store/state/state.ex.sw'

export class PkgApiStore extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!

  symbols = {
    model: {
      init: $exSw.State._init_,
      cleanup: $exSw.State._cleanup_,
      versioner: $exSw.State._versioner_,
      parent: $exSw.State._parent_,
    },
  }

  async connect(): Promise<Obj>
  async connect(name: string): Promise<Obj>
  async connect(options: Options): Promise<Obj>
  async connect(...args: unknown[]) {
    let name: string | undefined = undefined
    let options: Options | undefined = undefined

    if (args.length === 1) {
      if (this.$.is.string(args[0])) {
        name = args[0]
      } else {
        options = args[0] as Options
      }
    } else if (args.length >= 2) {
      name = args[0] as string
      options = args[1] as Options
    }

    const location = this.getLocation(name)
    const state = await this.$.store.connect(location, options)
    return state.data
  }

  async disconnect(name?: string) {
    const location = this.getLocation(name)
    await this.$.store.disconnect(location)
  }

  transaction(fn: () => void) {
    this.$.store.transaction(fn)
  }

  local(state: Obj = {}) {
    throw new Error('Not implemented yet')
    return state
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
    const location = this.getLocation(name)
    await this.$.store.destroy(location)
  }

  private getLocation(name: undefined | string): Location {
    name ??= ':default'
    return [this.$pkg.name, ':state', name]
  }
}
