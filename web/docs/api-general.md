# General API

Most of the Epos APIs are organized into namespaces. For example, state APIs are available under `epos.state.*`, but several general-purpose APIs live directly under `epos.*`.

## `epos.fetch`

Same as the native [`fetch`](https://developer.mozilla.org/docs/Web/API/fetch), but allows for **cross-origin requests**, even from contexts where CORS would normally block them. Does not support streaming.

**Syntax:**

```js
epos.fetch(url, init?)
```

**Examples:**

```js
// GET request
const response = await epos.fetch('https://example.com/')
const html = await response.text()
console.log(html)

// POST request
const response = await epos.fetch('https://example.com/api/data', { method: 'POST' })
const data = await response.json()
console.log(data)
```

::: details How does this work?
Extension's service worker process is not subject to CORS restrictions. Epos proxies all `epos.fetch` requests through the service worker, which performs the actual network request. When using `epos.fetch`, you do not get an actual `Response` object; instead, it resolves with a plain object that has the same interface as `Response`.
:::

## `epos.browser`

Same as [chrome](https://developer.chrome.com/docs/extensions/reference/api/) API, but **works everywhere**.

Normally, you would use `chrome.*` directly, but those APIs are only available in privileged extension contexts and won't work inside regular web pages. Epos makes them available everywhere via `epos.browser.*`.

**Syntax:**

```js
epos.browser.*
```

**Examples:**

```js
// Methods work as expected
const tabs = await epos.browser.tabs.query({})
await epos.browser.tabs.remove(tabs[0].id)

// Listeners work too
epos.browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log('Tab updated:', tabId, changeInfo, tab)
})
```

::: details How does this work?
`epos.browser` proxies all API calls to the extension's service worker process, which has full access to the Chrome Extensions API. So calling `epos.browser.tabs.query()` will call `chrome.tabs.query()` in the service worker. This technique allows you to use chrome APIs from contexts where they are normally unavailable.

For listeners, Epos generates a unique ID for each listener and registers it in the service worker. When the event is triggered, the service worker sends a message back to the page, which then calls the appropriate listener function. When the listener is removed, Epos unregisters it in the service worker as well by its ID.
:::

## `epos.element`

Special `<div>` element isolated from the rest of the page that can be used as a container for your project.

Epos creates a special `<epos>` element and places it **before** the `<head>`, thus isolating it from the rest of the page. Inside this element, Epos keeps injected JS, CSS and dedicated `<div>` for your project. This `<div>` is available as `epos.element`.

<!-- prettier-ignore -->
```html
<!doctype html>
<html>
  <epos>
    <!-- JS and CSS injected by Epos -->
    <script src="..."></script>
    <link rel="stylesheet" href="..." />

    <!-- This is epos.element -->
    <div project="your-project-name">...</div> <!-- [!code ++] -->
  </epos>
  <head>
    ...
  </head>
  <body>
    ...
  </body>
</html>
```

You can use this element as a container for your app, but in most cases, you’ll use [`epos.render`](#epos-render) instead, which automatically renders your React app inside `epos.element`.

## `epos.render`

Renders a React component (or any JSX element) into the DOM.
If no container is provided, Epos creates a **default container** inside `epos.element`.
When a container is passed, rendering happens inside that element instead.

Basically, this is a thin wrapper around `ReactDOM.createRoot(...).render(...)` with some extra logic to handle default container creation. Additionally, `epos.render` wraps rendered JSX into `<React.StrictMode>`.

**Syntax:**

```js
epos.render(jsx, container?)
```

**Examples:**

```js
// Render into default container
epos.render(<App />)

// Render into specific container
epos.render(<App />, document.getElementById('root'))
```

::: details What is a "default container"?
Default container is a `<div root></div>` element that Epos automatically creates inside `epos.element` if no container is provided to `epos.render`.

<!-- prettier-ignore -->
```html
<epos>
  ...
  <div project="your-project-name">
    <div root></div> <!-- [!code ++] -->
  </div>
</epos>
```

If `mode: "shadow"` is set in your `epos.json`, this container is placed inside a Shadow DOM:

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

Wraps functional React components so they automatically re-render when parts of the connected Epos state change (see [State](/docs/api-state) section).
This is similar to `observer` from `mobx-react-lite`, but integrated with Epos’s state system.

**Syntax:**

```js
epos.component(ComponentFunction)
```

**Example:**

```js
const state = await epos.state.connect({ username: 'World' })

const Title = epos.component(props => {
  return (
    <h1>
      {props.greeting || 'Hello'}, {state.username}
    </h1>
  )
})
```
