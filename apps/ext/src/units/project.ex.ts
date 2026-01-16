export class Project extends ex.Unit {
  id: ProjectDef['id']
  mode: ProjectDef['mode']
  spec: ProjectDef['spec']
  shadowCss: ProjectDef['shadowCss']
  fn: ProjectDef['fn'] | null = null
  bus: ReturnType<gl.Bus['use']>
  ext: ex.Ext
  states: exSw.States
  epos: ex.ProjectEpos

  constructor(parent: ex.Unit, def: ProjectDef) {
    super(parent)
    this.id = def.id
    this.mode = def.mode
    this.spec = def.spec
    this.shadowCss = def.shadowCss
    this.fn = def.fn
    this.bus = this.$.bus.use(`Project[${this.id}]`)
    this.ext = new ex.Ext(this, `Project[${this.id}]`)
    this.states = new exSw.States(this, this.id, ':state', this.getStatesConfig())
    this.epos = new ex.ProjectEpos(this)
  }

  async init() {
    await this.ext.init()
    await this.epos.init()
    if (this.spec.config.preloadAssets) await this.epos.api.assets.load()
    if (!this.fn) throw this.never()
    this.fn.call(null, this.epos.api)
    this.fn = null // Free up memory
  }

  private getStatesConfig() {
    return {
      allowMissingModels: this.spec.config.allowMissingModels,
    }
  }
}
