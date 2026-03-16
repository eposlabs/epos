::: warning

This is AI-generated draft based on Epos source code. Proper documentation is coming soon.

:::

# epos.\*

These are the top-level APIs exposed directly on `epos`.

## epos.fetch()

```ts
epos.fetch(url: string | URL, init?: ReqInit): Promise<Res>
```

A `fetch`-like API that performs the request through the extension side instead of the page side.

### Parameters

- `url` — a string or `URL`. Relative URLs are resolved against `location.href` before the request is sent.
- `init` — a subset of `RequestInit`.

### Returns

A Promise that resolves to a `Response`-like object with these fields and methods:

- `ok`
- `url`
- `type`
- `status`
- `statusText`
- `redirected`
- `headers`
- `text()`
- `json()`
- `blob()`

### Notes

- This bypasses page-level CORS restrictions because the request is performed through the extension service worker.
- Host permissions still apply. `epos.fetch()` does not bypass the extension permission model.
- The response is not a full browser `Response` object. Streaming APIs are not exposed.
- The stored response body is kept for a limited time. If you try to read it too late, the read can fail with a timeout error.

### Example

```ts
const response = await epos.fetch('https://api.example.com/data')

if (!response.ok) {
  throw new Error(`Request failed: ${response.status}`)
}

const data = await response.json()
```

## epos.browser

```ts
epos.browser: Browser
```

The Epos wrapper around a supported subset of `chrome.*`.

### Always-available namespaces

- `action`
- `alarms`
- `declarativeNetRequest`
- `extension`
- `i18n`
- `management`
- `permissions`
- `runtime`
- `tabs`
- `webNavigation`
- `windows`

### Permission-gated namespaces

These appear only when the project has access to the matching permission:

- `browsingData`
- `contextMenus`
- `cookies`
- `downloads`
- `notifications`
- `sidePanel`
- `storage`

### Notes

- The API works in places where `chrome.*` normally does not, including web pages and iframes.
- Event listeners are proxied through the extension side. If the page or frame that registered a listener disappears, Epos eventually cleans that listener up.
- Optional namespaces can appear or disappear after permission changes. The wrapper object is rebuilt when permissions are granted or removed.
- `permissions.contains()`, `permissions.getAll()`, `permissions.remove()`, and `permissions.request()` use the Epos permission model and always return Promises.
- `declarativeNetRequest.updateDynamicRules()` and `updateSessionRules()` do not accept rule IDs in `addRules`. Epos assigns the IDs and returns them.
- `contextMenus.create()` returns the final menu id as a Promise.
- `storage.local`, `storage.session`, and `storage.sync` are namespaced per project, so one project only sees its own keys through this wrapper.

### Example

```ts
const tabs = await epos.browser.tabs.query({ active: true })

epos.browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log(tabId, tab.url)
})
```

For the full Chrome-side concepts, see the
[Chrome Extensions API reference](https://developer.chrome.com/docs/extensions/reference/api).

## epos.render()

```ts
epos.render(node: ReactNode, container?: Container): void
```

Renders a React node into the current project DOM.

### Parameters

- `node` — the React node to render.
- `container` — optional custom container.

### Notes

- If `container` is omitted, Epos picks a default one.
- When the project uses shadow CSS, the default container is `epos.dom.shadowView`.
- Otherwise the default container is `epos.dom.view`.
- Rendering is wrapped in `React.StrictMode`.

### Example

```tsx
function App() {
  return <div>Hello</div>
}

epos.render(<App />)
```

## epos.component()

```ts
epos.component<T>(Component: React.FC<T>): React.FC<T>
```

Wraps a React component so it reacts to observable Epos state.

### Notes

- This is the Epos-aware wrapper used for components that read shared or local observable state.
- Internally it uses `mobx-react-lite` observer behavior.
- Props and hooks continue to work as usual.

### Example

```tsx
const state = await epos.state.connect({ count: 0 })

const Counter = epos.component(() => {
  return <button onClick={() => state.count++}>{state.count}</button>
})
```
