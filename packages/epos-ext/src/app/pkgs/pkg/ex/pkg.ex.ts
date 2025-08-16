export type PkgOpts = {
  name: string
  icon: string | null
  title: string | null
  shadowCss: string
  tabId: number
}

export class Pkg extends $ex.Unit {
  name: string
  icon: string | null
  title: string | null
  shadowCss: string
  tabId: number
  declare api: Awaited<ReturnType<Pkg['createApi']>>

  constructor(parent: $ex.Unit, opts: PkgOpts) {
    super(parent)

    this.name = opts.name
    this.icon = opts.icon
    this.title = opts.title
    this.shadowCss = opts.shadowCss
    this.tabId = opts.tabId
    this.api = this.createApi()

    // Set title and favicon for hub page
    if (this.$.env.is.exTabHub) {
      this.setPageTitle()
      async: this.setPageFavicon()
    }
  }

  private createApi() {
    const bus = new $ex.PkgBus(this)
    const state = new $ex.PkgState(this)
    const ui = new $ex.PkgUi(this)
    const unit = new $ex.PkgUnit(this)
    const tools = new $ex.PkgTools(this)
    const storage = new $ex.PkgStorage(this)
    const assets = new $ex.PkgAssets(this)
    const env = new $ex.PkgEnv(this)
    const libs = new $ex.PkgLibs(this)

    const epos = {
      // Bus
      on: bus.on,
      off: bus.off,
      once: bus.once,
      send: bus.send,
      emit: bus.emit,

      // State
      connect: state.connect,
      disconnect: state.disconnect,
      transaction: state.transaction,
      local: state.local,
      states: state.states,
      destroy: state.destroy,
      autorun: state.autorun,
      reaction: state.reaction,

      // UI
      get root() {
        return ui.ensureRoot()
      },
      get shadow() {
        return ui.ensureShadow()
      },
      component: ui.component,
      render: ui.render,
      portal: ui.portal,
      useState: ui.useState,
      useAutorun: ui.useAutorun,
      useReaction: ui.useReaction,

      // Unit
      Unit: unit.Unit,
      register: unit.register,
      units: unit.units,

      // Tools
      fetch: tools.fetch,
      get browser() {
        return tools.getExtApi()
      },

      // Storage
      get: storage.get,
      set: storage.set,
      delete: storage.delete,
      keys: storage.keys,
      clear: storage.clear,
      storage: storage.storage,
      storages: storage.storages,

      // Assets
      url: assets.url,
      load: assets.load,
      unload: assets.unload,
      assets: assets.assets,

      // Env
      tabId: env.tabId,
      is: env.is,

      // Libs
      mobx: libs.mobx,
      mobxReactLite: libs.mobxReactLite,
      react: libs.react,
      reactDom: libs.reactDom,
      reactDomClient: libs.reactDomClient,
      reactJsxRuntime: libs.reactJsxRuntime,
      yjs: libs.yjs,
    }

    class Epos {}
    Reflect.setPrototypeOf(epos, Epos.prototype)

    return epos
  }

  async setPageTitle() {
    // Remove existing title
    let title = document.querySelector('title')
    if (title) title.remove()

    // Create title
    title = document.createElement('title')
    title.textContent = this.title ?? this.name
    document.head.append(title)
  }

  private async setPageFavicon() {
    if (!this.icon) return

    await this.api.load(this.icon)

    // Remove existing favicon
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (favicon) favicon.remove()

    // Create favicon
    favicon = document.createElement('link')
    favicon.rel = 'icon'
    favicon.href = this.api.url(this.icon)
    document.head.append(favicon)
  }
}
