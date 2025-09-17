export class PkgApi extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!
  general!: $ex.PkgApiGeneral
  bus = this.$.bus.create(`pkg[${this.$pkg.name}]`)
  store = new $ex.PkgApiStore(this)
  storage = new $ex.PkgApiStorage(this)
  assets!: $ex.PkgApiAssets
  env = new $ex.PkgApiEnv(this)
  libs = new $ex.PkgApiLibs(this)
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

      // Store
      store: {
        connect: this.$.utils.link(this.store, 'connect'),
        disconnect: this.$.utils.link(this.store, 'disconnect'),
        transaction: this.$.utils.link(this.store, 'transaction'),
        local: this.$.utils.link(this.store, 'local'),
        list: this.$.utils.link(this.store, 'list'),
        destroy: this.$.utils.link(this.store, 'destroy'),
        symbols: this.store.symbols,
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
