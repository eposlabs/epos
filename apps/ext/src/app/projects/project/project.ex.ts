export class Project extends ex.Unit {
  name: ProjectDef['name']
  shadowCss: ProjectDef['shadowCss']
  config: ProjectDef['config']
  fn: ProjectDef['fn'] | null = null
  states: exSw.States
  bus: ReturnType<gl.Bus['create']>
  epos: ex.ProjectEpos

  constructor(parent: ex.Unit, def: ProjectDef) {
    super(parent)
    this.name = def.name
    this.shadowCss = def.shadowCss
    this.config = def.config
    this.fn = def.fn
    this.bus = this.$.bus.create(`Project[${this.name}]`)
    this.states = new exSw.States(this, this.name, ':state', this.config)
    this.epos = new ex.ProjectEpos(this)
  }

  async init() {
    await this.epos.init()
    if (!this.config.noPreloadAssets) await this.epos.api.asset.load()
    if (!this.fn) throw this.never()
    this.fn.call(null, this.epos.api)
    this.fn = null // Free up memory
  }
}
