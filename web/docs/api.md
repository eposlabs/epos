# API

The Epos API is divided into several sections, each focusing on a specific area of functionality.

- **General** `epos.*` — core utilities and helpers available globally, including DOM rendering, component wrapping, browser API access, and fetch helpers.

- **Bus** `epos.bus.*` — handles messaging between different extension contexts (popup, background, content script, etc.).

- **State** `epos.state.*` — manages reactive shared state across contexts, supporting transactions, synchronization, and local data.

- **Storage** `epos.storage.*` — provides persistent key–value storage for project data.

- **Static** `epos.static.*` — manages static assets such as images, scripts, and other files used by the project.

- **Frame** `epos.frame.*` — controls background or embedded frames, allowing creation, tracking, and cleanup of iframes.

- **Environment** `epos.env.*` — exposes runtime information about the current context (tab, popup, side panel, background).

- **Libs** `epos.libs.*` — gives access to core libraries bundled with Epos, like React, MobX, and Yjs.

## Full API Reference

This is a comprehensive list of all available API methods and properties, organized by section.

- [General](/docs/api-general)
  - [epos.fetch](/docs/api-general#epos-fetch)
  - [epos.browser](/docs/api-general#epos-browser)
  - [epos.element](/docs/api-general#epos-element)
  - [epos.render](/docs/api-general#epos-render)
  - [epos.component](/docs/api-general#epos-component)

- [Bus](/docs/api-bus)
  - [epos.bus.on](/docs/api-bus#epos-bus-on)
  - [epos.bus.off](/docs/api-bus#epos-bus-off)
  - [epos.bus.send](/docs/api-bus#epos-bus-send)
  - [epos.bus.emit](/docs/api-bus#epos-bus-emit)
  - [epos.bus.once](/docs/api-bus#epos-bus-once)
  - 🎓 [epos.bus.setSignal](/docs/api-bus#epos-bus-setSignal)
  - 🎓 [epos.bus.waitSignal](/docs/api-bus#epos-bus-waitSignal)

- [State](/docs/api-state)
  - [epos.state.connect](/docs/api-state#epos-state-connect)
  - [epos.state.disconnect](/docs/api-state#epos-state-disconnect)
  - [epos.state.transaction](/docs/api-state#epos-state-transaction)
  - [epos.state.local](/docs/api-state#epos-state-local)
  - [epos.state.destroy](/docs/api-state#epos-state-destroy)
  - [epos.state.list](/docs/api-state#epos-state-list)
  - 🎓 [epos.state.symbols](/docs/api-state#epos-state-symbols)
  - 🎓 [epos.state.register](/docs/api-state#epos-state-register)

- [Storage](#storage)
  - [epos.storage.get](#epos-storage-get)
  - [epos.storage.set](#epos-storage-set)
  - [epos.storage.delete](#epos-storage-delete)
  - [epos.storage.keys](#epos-storage-keys)
  - [epos.storage.clear](#epos-storage-clear)
  - [epos.storage.use](#epos-storage-use)
  - [epos.storage.list](#epos-storage-list)

- [Frame](#frame)
  - [epos.frame.open](#epos-frame-open)
  - [epos.frame.close](#epos-frame-close)
  - [epos.frame.exists](#epos-frame-exists)
  - [epos.frame.list](#epos-frame-list)

- [Static](#static)
  - [epos.static.url](#epos-static-url)
  - [epos.static.load](#epos-static-load)
  - [epos.static.loadAll](#epos-static-loadAll)
  - [epos.static.unload](#epos-static-unload)
  - [epos.static.unloadAll](#epos-static-unloadAll)
  - [epos.static.list](#epos-static-list)

- [Environment](#environment)
  - [epos.env.tabId](#epos-env-tabId)
  - [epos.env.isWeb](#epos-env-isWeb)
  - [epos.env.isPopup](#epos-env-isPopup)
  - [epos.env.isSidePanel](#epos-env-isSidePanel)
  - [epos.env.isBackground](#epos-env-isBackground)

- [Libs](#libs)
  - [epos.libs.mobx](#epos-libs-mobx)
  - [epos.libs.mobxReactLite](#epos-libs-mobxReactLite)
  - [epos.libs.react](#epos-libs-react)
  - [epos.libs.reactDom](#epos-libs-reactDom)
  - [epos.libs.reactDomClient](#epos-libs-reactDomClient)
  - [epos.libs.reactJsxRuntime](#epos-libs-reactJsxRuntime)
  - [epos.libs.yjs](#epos-libs-yjs)
