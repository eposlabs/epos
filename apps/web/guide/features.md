# Features

Epos is packed with built-in tools designed to simplify extension development. Each tool is pre-configured to work across all execution contexts — popup, background, injected content scripts (web pages), and others — without any additional setup.

In this section, we highlight the core features that make Epos stand out. For deep dives and implementation details, check the relevant guide sections or see the full [API Reference](/api/).

## Messaging System

Epos provides a high-level messaging system called `bus`. It is like `chrome.runtime.sendMessage`, but **10x better**.

Simply call `epos.bus.send` from any context, and Epos will deliver the message to every `epos.bus.on` listener — no matter where they are located.

The engine handles the **routing automatically**, picking the most efficient path to the destination. This allows you to seamlessly exchange messages across different contexts without worrying about the underlying mechanics. Just send and receive:

```js
// (background.js)
// Set up a message listener
epos.bus.on('getUserData', async userId => {
  const user = await fetchUserData(userId)
  return user // Simply return the data to send it back
})

// (popup.js)
// Send a message and receive the response
const user = await epos.bus.send('getUserData', 123)

// (injected-script.js)
// Works in injected content scripts
const user = await epos.bus.send('getUserData', 123)

// (injected-to-iframe.js)
// Even works within iframes
const user = await epos.bus.send('getUserData', 123)
```

## State Management

The most powerful feature of Epos is its state management system. It allows you to interact with your extension's data as if it were a **regular JavaScript object**. Behind the scenes, the engine handles two critical tasks: **Persistence** and **Synchronization**.

#### State as an Object

Interact with the state just as you would with a regular JavaScript object. You can use nested fields, arrays, and any complex data structures. To modify data, simply use standard JavaScript operations — assignment, push, splice, and so on:

```js
// Connect to the state
const state = await epos.state.connect()

// Modify it like a regular JS object
state.value = 10
state.value += 5
state.items = [{ id: 1, name: 'Item 1' }]
state.items.push({ id: 2, name: 'Item 2' })
state.items[1].name = 'Updated Item 2'
```

#### Persistence & Sync

Every change you make is **automatically saved to IndexedDB**. This means if a user closes the popup or restarts their browser, the data is restored exactly where they left it. Furthermore, the state is **synchronized in real-time** across all contexts — if your background script updates a value, your popup UI reflects that change instantly.

#### React Integration

To make your UI reactive, you just wrap your component in `epos.component()`. The engine will track which parts of the state your component uses and trigger a re-render only when that specific data changes:

```tsx
// Connect to the state with an initial value
const state = await epos.state.connect({ value: 10, items: [] })

// Wrap your component so it reacts to state changes
const App = epos.component(() => {
  return (
    <div>
      <h1>Value: {state.value}</h1>
      <ul>
        {state.items.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  )
})

// Changes are automatically persisted, synced, and reflect in the UI
state.value = 30
state.items.push({ id: 1, name: 'New Item' })
```

## Cross-Context Browser APIs

Standard `chrome.*` APIs can only be called from specific extension contexts like the
background service worker or the popup, and you cannot access them from regular web pages.

Epos removes these boundaries. By using `epos.browser.*`, you can call Chrome APIs from **any context** — including regular web pages and iframes.

#### Familiar Syntax

`epos.browser.*` mirrors the standard `chrome.*` APIs in both syntax and behavior. If you know how to use `chrome.tabs.query`, you already know how to use `epos.browser.tabs.query`. The only difference is that with Epos, you can call it from any context.

#### Automatic Setup

Like all Epos features, the engine handles the required setup automatically. All the hard work is done behind the scenes. Just use `epos.browser.*` and Epos takes care of the rest.

#### Example

::: code-group

```js [injected-script.js]
// Works! Even though we are executing the code on a
// regular web page that does not have Chrome API access.
const tabs = await epos.browser.tabs.query({})

// Listeners work as well
epos.browser.windows.onCreated.addListener(window => {
  console.log('New window created:', window)
})
```

:::

## Storage

For storing files, large datasets, or any non-state data, Epos provides a built-in storage system. It acts as a smart wrapper around **IndexedDB**, offering a simple key-value API that works across all extension contexts with zero setup required.

#### Simpler API

Standard IndexedDB is difficult to work with. It lacks a simple API and requires manual versioning and schema migrations. Epos handles all of this automatically. You simply write and read data without worrying about the underlying database lifecycle.

#### Native File Support

Unlike `chrome.storage`, which only supports JSON-serializable data, `epos.storage` has native support for files. You can store and retrieve Blobs, Files, and other binary data alongside regular JSONs.

#### Global Access

Like all Epos features, the storage is context-agnostic. You can save a file in the popup and retrieve it in the background.

#### Example

```js
// (popup.js)
await epos.storage.set('user-profile-pic', imageFile)

// (background.js)
const profilePic = await epos.storage.get('user-profile-pic')
```

## Simplified Setup

All Epos APIs are designed to work out of the box in any context, in the same way, without additional configuration.

Furthermore, the engine abstracts away manual script injection into web pages and provides a simpler way to define your extension via special `epos.json` configuration file that replaces the standard `manifest.json`.

#### Declarative Loading

Just tell Epos **what** files to load and **where** — it handles the rest. Epos knows how to inject scripts and styles, and setup all required environment automatically.

#### Automatic Shadow DOM

Just prefix CSS files with `shadow:` and Epos will automatically inject them into a Shadow DOM, preventing style conflicts with the host page. Again, no need for manual setup. Everything is handled by the engine automatically.

#### Example

::: code-group

```json [epos.json]
{
  "name": "My Extension",
  "targets": [
    {
      "matches": "*://*.example.com/*",
      "load": [
        "global.css", // Injected into the main DOM
        "shadow:app.css", // Injected into a Shadow DOM
        "app.js"
      ]
    },
    {
      "matches": "<popup>",
      "load": ["popup.js", "popup.css"]
    },
    {
      "matches": "<background>",
      "load": ["background.js"]
    }
  ]
}
```

:::
