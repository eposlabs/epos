---
outline: [2, 3]
---

# General APIs

Most Epos APIs are categorized and available under `epos.<category>.*`. However, some general-purpose tools live under `epos.*` directly. This section covers these APIs.

## epos.fetch()

This method is the same as the standard `fetch`, but it bypasses CORS (Cross-Origin Resource Sharing) restrictions. This allows you to fetch `https://some.website` while your extension is running on `https://another.website`. A normal `fetch` would fail due to CORS policies, but `epos.fetch` will work.

```ts
epos.fetch(url: string | URL, init?: RequestInit): Promise<Response>
```

#### Parameters

- `url` - The URL to fetch
- `init` - Optional fetch configuration (body, headers, method, etc.)

#### Returns

A Promise that resolves with a `Response`-like object.

#### Example

```ts
// Fetch JSON data
const response = await epos.fetch('https://api.example.com/data')
const data = await response.json()

// POST request
const response = await epos.fetch('https://api.example.com/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ value: 15 }),
})
```

#### How it works

This is achieved by **proxying** the request through the extension's **service worker**, which is not subject to the CORS restrictions.

#### Limitations

This API does not support **streaming responses**. Some fields of `Response` and `RequestInit` objects are also missing in `epos.fetch`. All available fields and methods are provided with TypeScript types.

## epos.browser

This is a **WebExtensions API** (`chrome.*`) that works in any context. Standard Chrome APIs are restricted to the service worker and extension pages, but Epos makes these APIs available in all contexts, including code running on web pages.

#### Example

```ts
// Get all tabs
const tabs = await epos.browser.tabs.query({})

// Listen for tab updates
epos.browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log('Tab updated:', tab.url)
})
```

#### How it works

This is achieved by **proxying** the API calls through the extension's **service worker**, which has access to the full WebExtensions API. For each listener callback, a unique ID is generated which tells the service worker which callback to invoke when an event occurs. If your app registers listeners on a web page and that page is then closed, Epos will automatically clean up all the listeners associated with that page.

#### Limitations

Only a limited number of WebExtensions APIs are supported. All APIs are declared with TypeScript types. As with the standard WebExtensions API, some of these require specific permissions.

## epos.render()

Renders a React node into the DOM.

Epos pre-creates an element structure for your app, and `epos.render` renders there by default. To know more about pre-created elements, see the [DOM API](api-dom.md).

```ts
epos.render(node: ReactNode, container?: Container): void
```

#### Parameters

- `node` - The React element to render
- `container` - Optional container element. If not provided, uses the default root element.

#### Example

```tsx
function App() {
  return <div>APP</div>
}

// Render into default container
epos.render(<App />)

// Render into custom container
const customRoot = document.getElementById('custom-root')
epos.render(<App />, customRoot)
```

## epos.component()

Makes a React component reactive. If the component uses an Epos state, it will automatically re-render when that state changes.

```ts
epos.component<T>(Component: React.FC<T>): React.FC<T>
```

#### Parameters

- `Component` - The React functional component to make reactive

#### Returns

A reactive version of the component that will automatically re-render when the state changes.

#### Example

```tsx
import { useState } from 'react'

// Connect to epos state
const state = await epos.state.connect({ count: 0 })

// Counter will re-render when `state.count` changes
const Counter = epos.component(() => {
  return (
    <div>
      <div>Count: {state.count}</div>
      <button onClick={() => state.count++}>Increment</button>
    </div>
  )
})

// Props and hooks work as usual
const App = epos.component(props => {
  const [text, setText] = useState('Hello')
  return (
    <div>
      <div>
        {props.name} | {state.count} | {text}
      </div>
      <input value={text} onChange={e => setText(e.target.value)} />
    </div>
  )
})
```
