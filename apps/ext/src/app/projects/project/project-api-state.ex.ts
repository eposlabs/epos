import type { Location, ModelClass, Initial, Versioner, Config } from '../../states/state/state.ex.sw'

export class ProjectApiState extends ex.Unit {
  private $api = this.up(ex.ProjectApi)!
  private $project = this.up(ex.Project)!
  private states: { [stateName: string]: exSw.State } = {}
  private models: { [modelName: string]: ModelClass } = {}
  private config: Config = {}

  symbols = {
    parent: exSw.State._parent_,
    modelInit: exSw.State._modelInit_,
    modelCleanup: exSw.State._modelCleanup_,
    modelStrict: exSw.State._modelStrict_,
    modelVersioner: exSw.State._modelVersioner_,
  }

  async connect(initial?: Initial, versioner?: Versioner): Promise<Obj>
  async connect(name: string, initial?: Initial, versioner?: Versioner): Promise<Obj>
  async connect(...args: unknown[]): Promise<Obj> {
    let name: string | null
    let initial: Initial
    let versioner: Versioner
    if (this.$.utils.is.string(args[0])) {
      name = args[0]
      initial = (args[1] ?? {}) as Initial
      versioner = (args[2] ?? {}) as Versioner
    } else {
      name = null
      initial = (args[0] ?? {}) as Initial
      versioner = (args[1] ?? {}) as Versioner
    }

    name = this.prepareName(name, this.connect)
    const location = this.getLocation(name)

    this.states[name] = await this.$.states.connect(location, {
      initial,
      versioner,
      config: this.config,
      models: this.models,
    })

    return this.states[name].data
  }

  async disconnect(name?: string) {
    name = this.prepareName(name, this.disconnect)
    const location = this.getLocation(name)
    await this.$.states.disconnect(location)
    delete this.states[name]
  }

  async destroy(name?: string) {
    name = this.prepareName(name, this.destroy)
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

  configure(config: Config) {
    this.config = config
    Object.values(this.states).forEach(state => state.setConfig(config))
  }

  async list(filter: { connected?: boolean } = {}) {
    const names = await this.$.idb.keys(this.$project.name, ':state')
    return names
      .map(name => ({
        name: name === ':default' ? null : name,
        connected: this.$.states.isConnected([this.$project.name, ':state', name]),
      }))
      .filter(state => {
        if (this.$.utils.is.undefined(filter.connected)) return true
        return filter.connected === state.connected
      })
  }

  registerModels(models: Record<string, ModelClass>) {
    Object.assign(this.models, models)
    Object.values(this.states).forEach(state => state.registerModels(models))
  }

  private getLocation(name: string): Location {
    return [this.$project.name, ':state', name]
  }

  private prepareName(name: string | null | undefined, caller: Fn) {
    if (this.$.utils.is.absent(name)) return ':default'
    if (name === '') throw this.$api.error('State name cannot be an empty string', caller)
    if (name.startsWith(':')) throw this.$api.error(`State name cannot start with ':'`, caller)

    return name
  }
}
