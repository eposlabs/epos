---
outline: [2, 3]
---

# General API

The general API provides core functionality for working with web extensions, including custom fetch, browser API access, React rendering, and component creation.

## epos.fetch()

A CORS-bypassing fetch function that works like the standard `fetch` but without CORS restrictions. Note that it does not support streams.

```ts
epos.fetch(url: string | URL, init?: RequestInit): Promise<Response>
```

### Parameters

- `url` - The URL to fetch
- `init` - Optional fetch configuration (body, headers, method, etc.)

### Returns

A Promise that resolves to a Response-like object with properties:

- `ok`, `url`, `type`, `status`, `statusText`, `redirected`, `headers`
- Methods: `text()`, `json()`, `blob()`

### Example

```ts
// Fetch data without CORS restrictions
const response = await epos.fetch('https://api.example.com/data')
const data = await response.json()

// POST request
const response = await epos.fetch('https://api.example.com/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John' }),
})
```

## epos.browser

Access to the WebExtensions API (like `chrome.*`), but works in any context - background, content scripts, popup, side panel, and even in iframes.

```ts
epos.browser: Browser
```

### Example

```ts
// Get all tabs
const tabs = await epos.browser.tabs.query({})

// Create a notification
await epos.browser.notifications.create({
  type: 'basic',
  title: 'Hello',
  message: 'World',
  iconUrl: 'icon.png',
})

// Listen for tab updates
epos.browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log('Tab updated:', tab.url)
})
```

## epos.render()

Render a React node into the DOM. By default, it uses the appropriate root element based on your project's configuration (shadow DOM or regular DOM).

```ts
epos.render(node: ReactNode, container?: Container): void
```

### Parameters

- `node` - The React element to render
- `container` - Optional container element. If not provided, uses the default root based on your shadow CSS configuration

### Example

```ts
import { App } from './App'

// Render into default container
epos.render(<App />)

// Render into custom container
const customRoot = document.getElementById('custom-root')
epos.render(<App />, customRoot)
```

## epos.component()

Make a React component reactive to Epos state changes. This is a wrapper around MobX's `observer` that makes your component automatically re-render when any observable state it uses changes.

```ts
epos.component<T>(Component: React.FC<T>): React.FC<T>
```

### Parameters

- `Component` - The React functional component to make reactive

### Returns

A reactive version of the component that will automatically re-render when state changes

### Example

```ts
// Define a regular component
const Counter: React.FC = () => {
  const state = epos.state.connect({ count: 0 })

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => state.count++}>Increment</button>
    </div>
  )
}

// Make it reactive to state changes
export default epos.component(Counter)
```

::: tip
You only need to use `epos.component()` on components that directly access state. Child components that receive props don't need to be wrapped.
:::
