export class PkgApi extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!
  assets!: $ex.PkgApiAssets
  bus = this.$.bus.create(`pkg[${this.$pkg.name}]`)
  env = new $ex.PkgApiEnv(this)
  frames = new $ex.PkgApiFrames(this)
  general!: $ex.PkgApiGeneral
  libs = new $ex.PkgApiLibs(this)
  state = new $ex.PkgApiState(this)
  storage = new $ex.PkgApiStorage(this)
  epos!: ReturnType<$ex.PkgApi['createEpos']>

  static async create(parent: $ex.Unit) {
    const api = new PkgApi(parent)
    await api.init()
    return api
  }

  private async init() {
    this.general = await $ex.PkgApiGeneral.create(this)
    this.assets = await $ex.PkgApiAssets.create(this)
    this.epos = this.createEpos()
  }

  private createEpos() {
    const epos = {
      // TODO: change to package API
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
        remove: this.$.utils.link(this.state, 'remove'),
        registerGlobalModels: this.$.utils.link(this.state, 'registerGlobalModels'),
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

      // Assets
      assets: {
        url: this.$.utils.link(this.assets, 'url'),
        load: this.$.utils.link(this.assets, 'load'),
        unload: this.$.utils.link(this.assets, 'unload'),
        list: this.$.utils.link(this.assets, 'list'),
      },

      // Frames
      frames: {
        create: this.$.utils.link(this.frames, 'create'),
        remove: this.$.utils.link(this.frames, 'remove'),
        list: this.$.utils.link(this.frames, 'list'),
      },

      // Env
      env: {
        tabId: this.env.tabId,
        isTab: this.env.isTab,
        isPopup: this.env.isPopup,
        isPanel: this.env.isPanel,
        isShell: this.env.isShell,
        isBackground: this.env.isBackground,
        isForeground: this.env.isForeground,
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
