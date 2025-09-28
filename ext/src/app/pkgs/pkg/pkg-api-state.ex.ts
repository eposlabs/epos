import type { Location, ModelClass, Initial, Versioner } from '../../states/state/state.ex.sw'

export class PkgApiState extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!
  private states: { [stateName: string]: $exSw.State } = {}
  private models: { [modelName: string]: ModelClass } = {}

  symbols = {
    parent: $exSw.State._parent_,
    modelInit: $exSw.State._modelInit_,
    modelCleanup: $exSw.State._modelCleanup_,
    modelVersioner: $exSw.State._modelVersioner_,
  }

  async connect(initial?: Initial, versioner?: Versioner): Promise<Obj>
  async connect(name: string, initial?: Initial, versioner?: Versioner): Promise<Obj>
  async connect(...args: unknown[]): Promise<Obj> {
    let name: string | undefined
    let initial: Initial
    let versioner: Versioner
    if (this.$.is.string(args[0])) {
      name = args[0]
      initial = (args[1] ?? {}) as Initial
      versioner = (args[2] ?? {}) as Versioner
    } else {
      name = undefined
      initial = (args[0] ?? {}) as Initial
      versioner = (args[1] ?? {}) as Versioner
    }

    name = this.prepareName(name)
    const location = this.getLocation(name)
    this.states[name] = await this.$.states.connect(location, { initial, versioner, models: this.models })
    return this.states[name].data.root
  }

  async disconnect(name?: string) {
    name = this.prepareName(name)
    const location = this.getLocation(name)
    await this.$.states.disconnect(location)
    delete this.states[name]
  }

  async destroy(name?: string) {
    name = this.prepareName(name)
    const location = this.getLocation(name)
    await this.$.states.remove(location)
    delete this.states[name]
  }

  local(data: Obj = {}): Obj {
    return this.$.libs.mobx.observable(data)
  }

  transaction(fn: () => void) {
    this.$.states.transaction(fn)
  }

  async list(filter: { connected?: boolean } = {}) {
    const names = await this.$.idb.keys(this.$pkg.name, ':state')
    return names
      .map(name => ({
        name: name === ':default' ? null : name,
        connected: this.$.states.isConnected([this.$pkg.name, ':state', name]),
      }))
      .filter(state => {
        if (this.$.is.undefined(filter.connected)) return true
        return filter.connected === state.connected
      })
  }

  registerModels(models: Record<string, ModelClass>) {
    Object.assign(this.models, models)
    Object.values(this.states).forEach(state => state.addModels(models))
  }

  private getLocation(name: string): Location {
    return [this.$pkg.name, ':state', name]
  }

  private prepareName(name?: string) {
    if (this.$.is.absent(name)) return ':default'
    if (name === '') throw new Error('State name cannot be an empty string')
    if (name.startsWith(':')) throw new Error(`State name cannot start with ':'`)
    return name
  }
}
