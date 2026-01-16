export class Project extends ex.Unit {
  id: ProjectDef['id']
  mode: ProjectDef['mode']
  spec: ProjectDef['spec']
  shadowCss: ProjectDef['shadowCss']
  fn: ProjectDef['fn'] | null = null
  bus: ReturnType<gl.Bus['use']>
  states: exSw.States
  browser: ex.ProjectBrowser
  epos: ex.ProjectEpos

  constructor(parent: ex.Unit, def: ProjectDef) {
    super(parent)
    this.id = def.id
    this.mode = def.mode
    this.spec = def.spec
    this.shadowCss = def.shadowCss
    this.fn = def.fn
    this.bus = this.$.bus.use(`Project[${this.id}]`)
    this.states = new exSw.States(this, this.id, ':state', { allowMissingModels: this.spec.config.allowMissingModels })
    this.browser = new ex.ProjectBrowser(this)
    this.epos = new ex.ProjectEpos(this)
  }

  async init() {
    await this.browser.init()
    await this.epos.init()
    if (this.spec.config.preloadAssets) await this.epos.api.assets.load()
    if (!this.fn) throw this.never()
    this.fn.call(null, this.epos.api)
    this.fn = null // Free up memory
  }
}
