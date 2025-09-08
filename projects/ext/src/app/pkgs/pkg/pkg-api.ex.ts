export class PkgApi extends $ex.Unit {
  bus = new $ex.PkgApiBus(this)
  state = new $ex.PkgApiState(this)
  ui = new $ex.PkgApiUi(this)
  unit = new $ex.PkgApiUnit(this)
  storage = new $ex.PkgApiStorage(this)
  assets = new $ex.PkgApiAssets(this)
  env = new $ex.PkgApiEnv(this)
  libs = new $ex.PkgApiLibs(this)
  tools!: $ex.PkgApiTools
  epos!: ReturnType<$ex.PkgApi['createEpos']>

  static async create(parent: $ex.Unit) {
    const api = new PkgApi(parent)
    await api.init()
    return api
  }

  private async init() {
    this.tools = await $ex.PkgApiTools.create(this)
    this.epos = this.createEpos()
  }

  private createEpos() {
    const epos = {
      // Bus
      on: this.bus.on,
      off: this.bus.off,
      once: this.bus.once,
      send: this.bus.send,
      emit: this.bus.emit,

      // State
      connect: this.state.connect,
      disconnect: this.state.disconnect,
      transaction: this.state.transaction,
      local: this.state.local,
      states: this.state.states,
      destroy: this.state.destroy,

      // UI
      element: this.ui.element,
      component: this.ui.component,
      render: this.ui.render,
      portal: this.ui.portal,
      useState: this.ui.useState,
      useAutorun: this.ui.useAutorun,
      useReaction: this.ui.useReaction,

      // Unit
      Unit: this.unit.Unit,
      register: this.unit.register,
      units: this.unit.units,

      // Tools
      fetch: this.tools.fetch,
      browser: this.tools.browser,
      autorun: this.tools.autorun,
      reaction: this.tools.reaction,

      // Storage
      get: this.storage.get,
      set: this.storage.set,
      delete: this.storage.delete,
      keys: this.storage.keys,
      clear: this.storage.clear,
      storage: this.storage.storage,
      storages: this.storage.storages,

      // Assets
      url: this.assets.url,
      load: this.assets.load,
      unload: this.assets.unload,
      assets: this.assets.assets,

      // Env
      tabId: this.env.tabId,
      is: this.env.is,

      // Libs
      mobx: this.libs.mobx,
      mobxReactLite: this.libs.mobxReactLite,
      react: this.libs.react,
      reactDom: this.libs.reactDom,
      reactDomClient: this.libs.reactDomClient,
      reactJsxRuntime: this.libs.reactJsxRuntime,
      yjs: this.libs.yjs,

      // TODO: change to package API
      engine: this.$,
    }

    class Epos {}
    Reflect.setPrototypeOf(epos, Epos.prototype)

    return epos
  }
}
