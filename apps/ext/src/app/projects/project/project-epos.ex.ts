import type { Epos } from 'epos'

export class ProjectEpos extends ex.Unit {
  private $project = this.closest(ex.Project)!
  declare api: ReturnType<ProjectEpos['createApi']>
  general = new ex.ProjectEposGeneral(this)
  bus = this.$.bus.create(`ProjectEpos[${this.$project.name}]`)
  state = new ex.ProjectEposState(this)
  storage = new ex.ProjectEposStorage(this)
  asset = new ex.ProjectEposAsset(this)
  frame = new ex.ProjectEposFrame(this)
  env = new ex.ProjectEposEnv(this)
  libs = new ex.ProjectEposLibs(this)
  symbols = new ex.ProjectEposSymbols(this)

  async init() {
    await this.general.init()
    await this.asset.init()
    this.api = this.createApi()
  }

  error(message: string, caller: Fn) {
    const error = new Error(`[epos] ${message}`)
    Error.captureStackTrace(error, caller)
    return error
  }

  private createApi() {
    const epos: Epos = {
      // TODO: change to project API
      // @ts-ignore
      engine: this.$,

      // General
      fetch: this.$.utils.link(this.general, 'fetch'),
      browser: this.general.browser,
      component: this.$.utils.link(this.general, 'component'),
      render: this.$.utils.link(this.general, 'render'),
      element: this.general.element,

      // Bus
      bus: {
        on: this.$.utils.link(this.bus, 'on'),
        off: this.$.utils.link(this.bus, 'off'),
        once: this.$.utils.link(this.bus, 'once'),
        send: this.$.utils.link(this.bus, 'send'),
        emit: this.$.utils.link(this.bus, 'emit'),
        setSignal: this.$.utils.link(this.bus, 'setSignal'),
        waitSignal: this.$.utils.link(this.bus, 'waitSignal'),
      },

      // State
      state: {
        connect: this.$.utils.link(this.state, 'connect'),
        disconnect: this.$.utils.link(this.state, 'disconnect'),
        transaction: this.$.utils.link(this.state, 'transaction'),
        local: this.$.utils.link(this.state, 'local'),
        list: this.$.utils.link(this.state, 'list'),
        remove: this.$.utils.link(this.state, 'remove'),
        register: this.$.utils.link(this.state, 'register'),
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

      // Frame
      frame: {
        open: this.$.utils.link(this.frame, 'open'),
        close: this.$.utils.link(this.frame, 'close'),
        exists: this.$.utils.link(this.frame, 'exists'),
        list: this.$.utils.link(this.frame, 'list'),
      },

      // Asset
      asset: {
        load: this.$.utils.link(this.asset, 'load'),
        unload: this.$.utils.link(this.asset, 'unload'),
        url: this.$.utils.link(this.asset, 'url'),
        get: this.$.utils.link(this.asset, 'get'),
        list: this.$.utils.link(this.asset, 'list'),
      },

      // Env
      env: {
        tabId: this.env.tabId,
        project: this.env.project,
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

      // Symbols
      symbols: {
        stateParent: this.symbols.stateParent,
        stateModelInit: this.symbols.stateModelInit,
        stateModelDispose: this.symbols.stateModelDispose,
        stateModelStrict: this.symbols.stateModelStrict,
        stateModelVersioner: this.symbols.stateModelVersioner,
      },
    }

    // Set prototype to see `Epos` in DevTools instead of a plain object
    {
      class Epos {}
      Reflect.setPrototypeOf(epos, Epos.prototype)
    }

    return epos
  }
}
