export class ProjectEpos extends ex.Unit {
  #api: ReturnType<ProjectEpos['createEposApi']> | null = null
  private $project = this.closest(ex.Project)!
  private bus = this.$.bus.scoped(`ProjectEpos[${this.$project.id}]`)
  general = new ex.ProjectEposGeneral(this)
  env = new ex.ProjectEposEnv(this)
  dom = new ex.ProjectEposDom(this)
  state = new ex.ProjectEposState(this)
  storage = new ex.ProjectEposStorage(this)
  assets = new ex.ProjectEposAssets(this)
  frames = new ex.ProjectEposFrames(this)
  libs = new ex.ProjectEposLibs(this)
  projects = new ex.ProjectEposProjects(this)

  async init() {
    await this.assets.init()
    this.#api = this.createEposApi()
  }

  get api() {
    if (!this.#api) throw this.never()
    return this.#api
  }

  error(message: string, caller: Fn) {
    const error = new Error(message)
    Error.captureStackTrace(error, caller)
    return error
  }

  private createEposApi() {
    const epos: PartialEpos = {
      // General
      fetch: this.$.utils.link(this.general, 'fetch'),
      browser: this.general.browser,
      component: this.$.utils.link(this.general, 'component'),
      render: this.$.utils.link(this.general, 'render'),

      // Env
      env: {
        tabId: this.env.tabId,
        windowId: this.env.windowId,
        isPopup: this.env.isPopup,
        isSidePanel: this.env.isSidePanel,
        isBackground: this.env.isBackground,
        project: this.env.project,
      },

      // Dom
      dom: {
        root: this.dom.root,
        reactRoot: this.dom.reactRoot,
        shadowRoot: this.dom.shadowRoot,
        shadowReactRoot: this.dom.shadowReactRoot,
      },

      // Bus
      bus: {
        on: this.$.utils.link(this.bus, 'on'),
        off: this.$.utils.link(this.bus, 'off'),
        once: this.$.utils.link(this.bus, 'once'),
        send: this.$.utils.link(this.bus, 'send'),
        emit: this.$.utils.link(this.bus, 'emit'),
        register: this.$.utils.link(this.bus, 'register'),
        unregister: this.$.utils.link(this.bus, 'unregister'),
        use: this.$.utils.link(this.bus, 'use'),
        setSignal: this.$.utils.link(this.bus, 'setSignal'),
        waitSignal: this.$.utils.link(this.bus, 'waitSignal'),
      },

      // State
      state: {
        connect: this.$.utils.link(this.state, 'connect'),
        disconnect: this.$.utils.link(this.state, 'disconnect'),
        transaction: this.$.utils.link(this.state, 'transaction'),
        create: this.$.utils.link(this.state, 'create'),
        list: this.$.utils.link(this.state, 'list'),
        remove: this.$.utils.link(this.state, 'remove'),
        register: this.$.utils.link(this.state, 'register'),
        PARENT: this.state.PARENT,
        ATTACH: this.state.ATTACH,
        DETACH: this.state.DETACH,
      },

      // Storage
      storage: {
        get: this.$.utils.link(this.storage, 'get'),
        set: this.$.utils.link(this.storage, 'set'),
        delete: this.$.utils.link(this.storage, 'delete'),
        keys: this.$.utils.link(this.storage, 'keys'),
        use: this.$.utils.link(this.storage, 'use'),
        list: this.$.utils.link(this.storage, 'list'),
        remove: this.$.utils.link(this.storage, 'remove'),
      },

      // Frames
      frames: {
        create: this.$.utils.link(this.frames, 'create'),
        remove: this.$.utils.link(this.frames, 'remove'),
        has: this.$.utils.link(this.frames, 'has'),
        list: this.$.utils.link(this.frames, 'list'),
      },

      // Assets
      assets: {
        url: this.$.utils.link(this.assets, 'url'),
        get: this.$.utils.link(this.assets, 'get'),
        list: this.$.utils.link(this.assets, 'list'),
        load: this.$.utils.link(this.assets, 'load'),
        unload: this.$.utils.link(this.assets, 'unload'),
      },

      // Project
      ...(this.$project.spec.config.allowProjectsApi && {
        projects: {
          has: this.$.utils.link(this.projects, 'has'),
          get: this.$.utils.link(this.projects, 'get'),
          list: this.$.utils.link(this.projects, 'list'),
          create: this.$.utils.link(this.projects, 'create'),
          update: this.$.utils.link(this.projects, 'update'),
          remove: this.$.utils.link(this.projects, 'remove'),
          export: this.$.utils.link(this.projects, 'export'),
          watch: this.$.utils.link(this.projects, 'watch'),
          fetch: this.$.utils.link(this.projects, 'fetch'),
        },
      }),

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

    // Set prototype to see `Epos` in DevTools instead of a plain object
    class Epos {}
    Reflect.setPrototypeOf(epos, Epos.prototype)

    return epos
  }
}
