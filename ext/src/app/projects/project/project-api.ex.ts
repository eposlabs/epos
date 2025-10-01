export class ProjectApi extends $ex.Unit {
  private $project = this.up($ex.Project)!
  general!: $ex.ProjectApiGeneral
  bus = this.$.bus.create(`project[${this.$project.name}]`)
  state = new $ex.ProjectApiState(this)
  storage = new $ex.ProjectApiStorage(this)
  static!: $ex.ProjectApiStatic
  frame = new $ex.ProjectApiFrame(this)
  env = new $ex.ProjectApiEnv(this)
  libs = new $ex.ProjectApiLibs(this)
  epos!: ReturnType<$ex.ProjectApi['createEpos']>

  static async create(parent: $ex.Unit) {
    const api = new ProjectApi(parent)
    await api.init()
    return api
  }

  private async init() {
    this.general = await $ex.ProjectApiGeneral.create(this)
    this.static = await $ex.ProjectApiStatic.create(this)
    this.epos = this.createEpos()
  }

  private createEpos() {
    const epos = {
      // TODO: change to project API
      engine: this.$,

      // General
      fetch: this.$.utils.link(this.general, 'fetch'),
      browser: this.general.browser,
      element: this.general.element,
      component: this.$.utils.link(this.general, 'component'),
      render: this.$.utils.link(this.general, 'render'),

      // Bus
      bus: {
        on: this.$.utils.link(this.bus, 'on'),
        off: this.$.utils.link(this.bus, 'off'),
        once: this.$.utils.link(this.bus, 'once'),
        send: this.$.utils.link(this.bus, 'send'),
        emit: this.$.utils.link(this.bus, 'emit'),
      },

      // State
      state: {
        connect: this.$.utils.link(this.state, 'connect'),
        disconnect: this.$.utils.link(this.state, 'disconnect'),
        transaction: this.$.utils.link(this.state, 'transaction'),
        local: this.$.utils.link(this.state, 'local'),
        list: this.$.utils.link(this.state, 'list'),
        destroy: this.$.utils.link(this.state, 'destroy'),
        registerModels: this.$.utils.link(this.state, 'registerModels'),
        symbols: this.state.symbols,
      },

      // Storage
      storage: {
        get: this.$.utils.link(this.storage, 'get'),
        set: this.$.utils.link(this.storage, 'set'),
        delete: this.$.utils.link(this.storage, 'delete'),
        keys: this.$.utils.link(this.storage, 'keys'),
        clear: this.$.utils.link(this.storage, 'clear'),
        use: this.$.utils.link(this.storage, 'use'),
        list: this.$.utils.link(this.storage, 'list'),
      },

      // Static
      static: {
        url: this.$.utils.link(this.static, 'url'),
        load: this.$.utils.link(this.static, 'load'),
        loadAll: this.$.utils.link(this.static, 'loadAll'),
        unload: this.$.utils.link(this.static, 'unload'),
        unloadAll: this.$.utils.link(this.static, 'unloadAll'),
        list: this.$.utils.link(this.static, 'list'),
      },

      // Frame
      frame: {
        open: this.$.utils.link(this.frame, 'open'),
        close: this.$.utils.link(this.frame, 'close'),
        exists: this.$.utils.link(this.frame, 'exists'),
        list: this.$.utils.link(this.frame, 'list'),
      },

      // Env
      env: {
        tabId: this.env.tabId,
        isWeb: this.env.isWeb,
        isPopup: this.env.isPopup,
        isSidePanel: this.env.isSidePanel,
        isBackground: this.env.isBackground,
      },

      // Libs
      libs: {
        mobx: this.libs.mobx,
        mobxReactLite: this.libs.mobxReactLite,
        react: this.libs.react,
        reactDom: this.libs.reactDom,
        reactDomClient: this.libs.reactDomClient,
        reactJsxRuntime: this.libs.reactJsxRuntime,
        yjs: this.libs.yjs,
      },
    }

    class Epos {}
    Reflect.setPrototypeOf(epos, Epos.prototype)

    return epos
  }
}
