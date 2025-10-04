# API Cheatsheet

- **[General](#general)**
  - [epos.fetch](#epos-fetch)
  - [epos.browser](#epos-browser)
  - [epos.element](#epos-element)
  - [epos.render](#epos-render)
  - [epos.component](#epos-component)

- **[Bus](#bus)**
  - [epos.bus.on](#epos-bus-on)
  - [epos.bus.off](#epos-bus-off)
  - [epos.bus.send](#epos-bus-send)
  - [epos.bus.emit](#epos-bus-emit)
  - [epos.bus.once](#epos-bus-once)
  - 🎓 [epos.bus.setSignal](#epos-bus-setSignal)
  - 🎓 [epos.bus.waitSignal](#epos-bus-waitSignal)

- **[State](#state)**
  - [epos.state.connect](#epos-state-connect)
  - [epos.state.disconnect](#epos-state-disconnect)
  - [epos.state.transaction](#epos-state-transaction)
  - [epos.state.local](#epos-state-local)
  - [epos.state.list](#epos-state-list)
  - 🎓 [epos.state.destroy](#epos-state-destroy)
  - 🎓 [epos.state.registerModels](#epos-state-registerModels)
  - 🎓 [epos.state.symbols.parent](#epos-state-symbols-parent)
  - 🎓 [epos.state.symbols.modelInit](#epos-state-symbols-modelInit)
  - 🎓 [epos.state.symbols.modelCleanup](#epos-state-symbols-modelCleanup)
  - 🎓 [epos.state.symbols.modelVersioner](#epos-state-symbols-modelVersioner)

- **[Storage](#storage)**
  - [epos.storage.get](#epos-storage-get)
  - [epos.storage.set](#epos-storage-set)
  - [epos.storage.delete](#epos-storage-delete)
  - [epos.storage.keys](#epos-storage-keys)
  - [epos.storage.clear](#epos-storage-clear)
  - [epos.storage.use](#epos-storage-use)
  - [epos.storage.list](#epos-storage-list)

- **[Static](#static)**
  - [epos.static.url](#epos-static-url)
  - [epos.static.load](#epos-static-load)
  - [epos.static.loadAll](#epos-static-loadAll)
  - [epos.static.unload](#epos-static-unload)
  - [epos.static.unloadAll](#epos-static-unloadAll)
  - [epos.static.list](#epos-static-list)

- **[Frame](#frame)**
  - [epos.frame.open](#epos-frame-open)
  - [epos.frame.close](#epos-frame-close)
  - [epos.frame.exists](#epos-frame-exists)
  - [epos.frame.list](#epos-frame-list)

- **[Env](#env)**
  - [epos.env.tabId](#epos-env-tabId)
  - [epos.env.isWeb](#epos-env-isWeb)
  - [epos.env.isPopup](#epos-env-isPopup)
  - [epos.env.isSidePanel](#epos-env-isSidePanel)
  - [epos.env.isBackground](#epos-env-isBackground)

- **[Libs](#libs)**
  - [epos.libs.mobx](#epos-libs-mobx)
  - [epos.libs.mobxReactLite](#epos-libs-mobxReactLite)
  - [epos.libs.react](#epos-libs-react)
  - [epos.libs.reactDom](#epos-libs-reactDom)
  - [epos.libs.reactDomClient](#epos-libs-reactDomClient)
  - [epos.libs.reactJsxRuntime](#epos-libs-reactJsxRuntime)
  - [epos.libs.yjs](#epos-libs-yjs)

## General

Most of the Epos APIs are contained within a namespace. For example, state APIs are available as `epos.state.*`, but there are some general APIs that are available directly under `epos.*`.

## `epos.fetch`

Same as the standard `fetch`, but allows for cross-origin requests.

**Usage**

- `epos.fetch(url, init?)`

**Examples**

```js
const response = await epos.fetch('https://example.com/')
const html = await response.text()
console.log(html)
```

::: details How does this work?
TBD
:::

## `epos.browser`

This is a one-to-one implementation of [Chrome Extensions API](https://developer.chrome.com/docs/extensions/reference/api). In regular extensions, `chrome.*` API is available only on special extension pages, while Epos's `epos.browser.*` works everywhere.

**Usage**

- `epos.browser.*`

**Examples**

```js
const tabs = await epos.browser.tabs.query({})
await epos.browser.tabs.remove(tabs[0].id)
```

## `epos.element`

Epos creates an `<epos/>` HTML element and places it before the `<head/>`. Although this is a non-standard placement, it allows Epos elements to remain isolated from the rest of the page. The `<epos/>` element serves as a container for the JavaScript and CSS injected by Epos, and it also contains a special `<div>` created specifically for your project, accessible as `epos.element`.

<!-- prettier-ignore -->
```html
<!doctype html>
<html>
  <epos>
    <!-- JS and CSS injected to page via Epos -->
    <script src="..."></script>
    <link rel="stylesheet" href="..."/>

    <!-- This is epos.element -->
    <div project="your-project-name">...</div> <!-- [!code ++] -->
  </epos>
  <head>...</head>
  <body>...</body>
</html>
```

For example, you can render HTML inside this element:

```js
epos.element.innerHTML = '<h1>Hello, Epos!</h1>'
```

In most cases though, you do not need to use `epos.element` directly, as `epos.render` (see below) automatically mounts your app inside it.

## `epos.render`

Renders a React component (or any JSX element) into the DOM. If no container is provided, the component is mounted into default root container. When a container is specified, the component is rendered inside that element instead.

**Usage**

- `epos.render(jsx)`
- `epos.render(jsx, container)`

**Examples**

```js
// Render into default container
epos.render(<App />)

// Render into specific container
epos.render(<App />, document.getElementById('root'))
```

::: details What is a "default root container"?

Default root container is a `<div root/>` element created automatically inside `epos.element`:

<!-- prettier-ignore -->
```html
<epos>
  ...
  <div project="your-project-name">
    <div root></div> <!-- [!code ++] -->
  </div>
</epos>
```

If you set `mode: shadow` in `epos.json`, the default container will be placed a shadow DOM:

<!-- prettier-ignore -->
```html
<epos>
  ...
  <div project="your-project-name">
    #shadow-root (open)
      <div root></div> <!-- [!code ++] -->
  </div>
</epos>
```

:::

## `epos.component`

Wraps functional React components so they can react to Epos state changes (see [State](#section) section below) and automatically re-render when any part of the used state changes.

**Usage**

- `epos.component(Component)`

**Examples**

```js
const state = await epos.state.connnect({ username: 'World' })

// This component will automatically re-render when `state.username` changes
const Title = epos.component(props => {
  return (
    <h1>
      {props.greeting || 'Hello'}, {state.username}
    </h1>
  )
})
```

## Bus

Bus API allows communication between different application contexts. For example, you can send messages from `<background>` to a tab.

## `epos.bus.on`

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

**Usage**

- `epos.bus.on(eventName, listener)`

## `epos.bus.off`

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## `epos.bus.send`

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## `epos.bus.emit`

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## `epos.bus.once`

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## 🎓 `epos.bus.setSignal`

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## 🎓 `epos.bus.waitSignal`

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Libs

The libs API provides access to various third-party libraries that are bundled with Epos. These libraries can be used to enhance the functionality of your application.
