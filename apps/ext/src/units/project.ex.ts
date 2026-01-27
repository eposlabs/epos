export class Project extends ex.Unit {
  id: ProjectDef['id']
  debug: ProjectDef['debug']
  enabled: ProjectDef['enabled']
  spec: ProjectDef['spec']
  manifest: ProjectDef['manifest']
  shadowCss: ProjectDef['shadowCss']
  fn: ProjectDef['fn'] | null = null
  bus: ReturnType<gl.Bus['for']>
  browser: ex.ProjectBrowser
  states: exSw.ProjectStates
  epos: ex.ProjectEpos

  constructor(parent: ex.Unit, def: ProjectDef) {
    super(parent)
    this.id = def.id
    this.debug = def.debug
    this.enabled = def.enabled
    this.spec = def.spec
    this.manifest = def.manifest
    this.shadowCss = def.shadowCss
    this.fn = def.fn
    this.bus = this.$.bus.for(`Project[${this.id}]`)
    this.browser = new ex.ProjectBrowser(this)
    this.states = new exSw.ProjectStates(this, { allowMissingModels: this.spec.config.allowMissingModels })
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
