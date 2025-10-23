# API

This is a comprehensive list of all available Epos API methods and properties.

## [General](/docs/api-general)

Misc general-purpose APIs that do not fit into separate namespace and live under the `epos.*` directly.

- [epos.fetch](/docs/api-general#epos-fetch)
- [epos.browser](/docs/api-general#epos-browser)
- [epos.element](/docs/api-general#epos-element)
- [epos.render](/docs/api-general#epos-render)
- [epos.component](/docs/api-general#epos-component)

## [Bus](/docs/api-bus)

Messaging system for inter-context communication.

- [epos.bus.on](/docs/api-bus#epos-bus-on)
- [epos.bus.off](/docs/api-bus#epos-bus-off)
- [epos.bus.send](/docs/api-bus#epos-bus-send)
- [epos.bus.emit](/docs/api-bus#epos-bus-emit)
- [epos.bus.once](/docs/api-bus#epos-bus-once)
- 🎓 [epos.bus.setSignal](/docs/api-bus#epos-bus-setSignal)
- 🎓 [epos.bus.waitSignal](/docs/api-bus#epos-bus-waitSignal)

## [State](/docs/api-state)

Reactive state management with synchronization across all contexts.

- [epos.state.connect](/docs/api-state#epos-state-connect)
- [epos.state.disconnect](/docs/api-state#epos-state-disconnect)
- [epos.state.local](/docs/api-state#epos-state-local)
- [epos.state.transaction](/docs/api-state#epos-state-transaction)
- [epos.state.destroy](/docs/api-state#epos-state-destroy)
- [epos.state.list](/docs/api-state#epos-state-list)
- [epos.state.configure](/docs/api-state#epos-state-configure)
- 🎓 [epos.state.symbols](/docs/api-state#epos-state-symbols)
- 🎓 [epos.state.registerModels](/docs/api-state#epos-state-register-models)

## [Storage](/docs/api-storage)

Persistent key–value storage. Saves data to IndexedDB.

- [epos.storage.get](/docs/api-storage#epos-storage-get)
- [epos.storage.set](/docs/api-storage#epos-storage-set)
- [epos.storage.delete](/docs/api-storage#epos-storage-delete)
- [epos.storage.keys](/docs/api-storage#epos-storage-keys)
- [epos.storage.clear](/docs/api-storage#epos-storage-clear)
- [epos.storage.use](/docs/api-storage#epos-storage-use)
- [epos.storage.list](/docs/api-storage#epos-storage-list)

## [Frame](/docs/api-frame)

Background iframes management. Useful for running background website automations.

- [epos.frame.open](/docs/api-frame#epos-frame-open)
- [epos.frame.close](/docs/api-frame#epos-frame-close)
- [epos.frame.exists](/docs/api-frame#epos-frame-exists)
- [epos.frame.list](/docs/api-frame#epos-frame-list)

## [Assets](/docs/api-assets)

Assets management.

- [epos.assets.url](/docs/api-assets#epos-assets-url)
- [epos.assets.load](/docs/api-assets#epos-assets-load)
- [epos.assets.unload](/docs/api-assets#epos-assets-unload)
- [epos.assets.list](/docs/api-assets#epos-assets-list)

## [Env](/docs/api-env)

Runtime environment information.

- [epos.env.tabId](/docs/api-env#epos-env-tabId)
- [epos.env.isWeb](/docs/api-env#epos-env-isWeb)
- [epos.env.isPopup](/docs/api-env#epos-env-isPopup)
- [epos.env.isSidePanel](/docs/api-env#epos-env-isSidePanel)
- [epos.env.isBackground](/docs/api-env#epos-env-isBackground)

## [Libs](/docs/api-libs)

Core libraries used by Epos. Exposed as `epos.libs.*` for convenience.

- [epos.libs.react](/docs/api-libs#epos-libs-react)
- [epos.libs.reactDom](/docs/api-libs#epos-libs-reactDom)
- [epos.libs.reactDomClient](/docs/api-libs#epos-libs-reactDomClient)
- [epos.libs.reactJsxRuntime](/docs/api-libs#epos-libs-reactJsxRuntime)
- [epos.libs.mobx](/docs/api-libs#epos-libs-mobx)
- [epos.libs.mobxReactLite](/docs/api-libs#epos-libs-mobxReactLite)
- [epos.libs.yjs](/docs/api-libs#epos-libs-yjs)
