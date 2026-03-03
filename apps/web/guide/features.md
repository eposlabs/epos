# Features

Epos is packed with built-in tools designed to steamline the extension development lifecycle. Each tool is pre-configured to work across all execution contexts without additional setup.

In this section, we will highlight the core features that make Epos stand out. For deep dives and implementation details, check the relevant guide sections or see the full [API Reference](/api/).

## Messaging System

Epos provides a messaging system called `bus`. It is like `chrome.runtime.sendMessage`, but **10x better**.

Simply call `epos.bus.send` from any context, and Epos will deliver the message to every `epos.bus.on` listener — no matter where they are located.

You can exchange messages across the popup, side panel, background, injected scripts, offscreen documents, and even iframes. The engine handles the **routing automatically**, picking the most efficient path to the destination.

```js
// [background.js]
// Set up a listener
epos.bus.on('getUserData', async userId => {
  const user = await fetchUserData(userId)
  return user // Simply return the data to send it back
})

// [popup.js]
// Send a message and receive the response
const user = await epos.bus.send('getUserData', 123)

// [injected-script.js]
// Works exactly the same in injected scripts
const user = await epos.bus.send('getUserData', 123)

// [injected-to-iframe.js]
// Even works within iframes
const user = await epos.bus.send('getUserData', 123)
```

## State Management

Epos provides a state management that lets you interact with your extension's data as if it were a regular JavaScript object. Behind the scenes, the engine handles two critical tasks: **Persistence** and **Synchronization**.

#### Persistence & Sync

Every change you make is automatically saved to IndexedDB. This means if a user closes the popup or restarts their browser, the data is restored exactly where they left it. Furthermore, the state is synchronized in real-time across all contexts — if your background script updates a value, your popup UI reflects that change instantly.

#### React Integration

To make your UI reactive, you don't need hooks or providers. Just wrap your component in `epos.component()`. The engine will track which parts of the state your component uses and trigger a re-render only when that specific data changes.

```tsx
// Connect to the state with an initial value
const state = await epos.state.connect({ value: 10, items: [] })

// Update it like a regular JS object.
// Changes are automatically persisted to IndexedDB and synced!
state.value = 30
state.items.push({ id: 1, name: 'New Item' })

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
```

#### The state that "just works"

- **Simplicity:** No mental overhead — just connect to a state and use it as a regular object.
- **Automatic persistence:** Your data is safe even if the user closes the extension or restarts their browser.
- **Real-time sync:** Changes in one context are reflected everywhere instantly, without manual message passing.

## Chrome APIs

Standard `chrome.*` APIs can only be called from specific extension contexts like the background service worker or the popup.

Epos removes these boundaries entirely. By using `epos.browser.*`, you can call Chrome APIs from **any context** — including regular web pages and iframes.

```ts
// [injected-script.js]
// Works! Even though we are executing the code on a regular web page
// that does not have Chrome API access.
const tabs = await epos.browser.tabs.query({})

// [injected-to-iframe.js]
// Even works within iframes!
epos.browser.windows.onCreated.addListener(window => {
  console.log('New window created:', window)
})
```

## Storage

For storing files, large datasets, or any non-state data, Epos provides a built-in storage system. It acts as a smart wrapper around **IndexedDB**, offering a simple key-value API that works across all extension contexts with zero setup required.

#### What makes it "Smart"?

Standard IndexedDB is difficult to work with. It does not provide simple APIs and requires manual versioning. If you want to add a new "store" for a different type of data, you usually have to bump the database version and handle `onupgradeneeded` events — a process that often requires an extension restart to take effect.

Epos handles these "magic tricks" for you. It performs schema migrations on the fly without restarts or manual version management. You simply write and read data; Epos handles the database lifecycle in the background.

```js
// [popup.js]
// Save a file or any data from one context
await epos.storage.set('user-profile-pic', imageFile)

// [injected-script.js]
// Access that same data from a completely different context
const profilePic = await epos.storage.get('user-profile-pic')
```

#### Key Features:

- Zero Setup: No need to initialize databases, open connections, or manage transaction states.
- True Global Sync: Save an item in the popup and retrieve it instantly in a content script, background worker, or even a nested iframe.
- Native Binary Support: Because it is powered by IndexedDB, it handles Blobs, Files, and ArrayBuffers natively and efficiently.
- On-the-fly Instances: Create isolated storage buckets whenever you need them without worrying about the underlying database structure.

For storing files and other non-state data, Epos provides a built-in storage system that acts as a smart wrapper around **IndexedDB**. It offers a simple key-value API that works across all extension contexts with zero setup required.

- Smart wrapper around IndexedDB
- Simple key-value API
- Works across all contexts without setup

Smart wrapper around IDB. What makes it smart? It works across all contexts without setup, and it allows you to create multiple named storage instances. With regular IndexedDB you would need to manually update the database version and provide new store initialization which requires an extension restart. Epos uses magic tricks to perform schema migrations without restart and any hassle. You just write and read data, Epos handles the hard lifting.

Epos provides a built-in storage system for files and data. It acts as a smart wrapper around **IndexedDB**, offering a simple key-value API that works across all extension contexts with zero setup required.

```ts
// popup.js
await epos.storage.set('my-image', image)

// injected-script.js
const image = await epos.storage.get('my-image')
```

## Simplified Setup

- Just tell Epos **what** code to load and **where**
- No manual script injection or shadow DOM configuration

Just tell Epos **what** files to load and **where** — it handles the rest. Epos abstracts the complexity of manual script injection or the technical differences between "isolated" and "main world" content scripts. Also Epos simplifies the process of injecting styles into the page by providing a `shadow:` prefix that automatically creates a shadow root and injects the CSS there.

::: code-group

```json [epos.json]
{
  "name": "My Extension",
  "targets": [
    {
      "matches": "*://*.example.com/*",
      "load": ["global.css", "app.js", "shadow:app.css"]
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

## More

Beside these highlighted features, Epos also provides a variety of other built-in utilities.

Epos includes a variety of built-in utilities designed to streamline the extension development lifecycle. Each feature is pre-configured to function across all execution contexts without additional setup.

You can find the complete list of capabilities in the [API Reference](/api/).

<!--
## Why Use Epos?

Bootstrap Micro SaaS fast using solidified apis.

## Features


<h4 class="flex gap-2 items-center [&_svg]:size-5 [&_svg]:text-amber-500">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-route-icon lucide-route"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>
  Universal Messaging
</h4>

<h4 class="flex gap-2 items-center [&_svg]:size-5 [&_svg]:text-green-500">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-database-zap-icon lucide-database-zap"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 15 21.84"/><path d="M21 5V8"/><path d="M21 12L18 17H22L19 22"/><path d="M3 12A9 3 0 0 0 14.59 14.87"/></svg>
  Auto-Sync State
</h4>

Define and modify your state as a standard JavaScript object. Epos **automatically persists and synchronizes** every change across all extension contexts. When the state updates, your React components re-render as well.

```ts
const state = await epos.state.connect({ name: 'my-extension' })
state.name = 'Epos' // Automatically persisted and synced
```

<h4 class="flex gap-2 items-center [&_svg]:size-5 [&_svg]:text-blue-500">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-puzzle-icon lucide-puzzle"><path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/></svg>
  Extension APIs, Everywhere
</h4>

Standard `chrome.*` APIs are restricted to specific extension contexts. Epos removes these boundaries, allowing you to call Extension APIs via `epos.browser.*` from **any** context — including regular web pages.

<h4 class="flex gap-2 items-center [&_svg]:size-5 [&_svg]:text-lime-500">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cog-icon lucide-cog"><path d="M11 10.27 7 3.34"/><path d="m11 13.73-4 6.93"/><path d="M12 22v-2"/><path d="M12 2v2"/><path d="M14 12h8"/><path d="m17 20.66-1-1.73"/><path d="m17 3.34-1 1.73"/><path d="M2 12h2"/><path d="m20.66 17-1.73-1"/><path d="m20.66 7-1.73 1"/><path d="m3.34 17 1.73-1"/><path d="m3.34 7 1.73 1"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="8"/></svg>
  Simplified Setup
</h4>

Just tell Epos **what** files to load and **where** — it handles the rest. Epos abstracts the complexity of manual script injection or the technical nuances between "isolated" and "main world" content scripts. This provides a streamlined approach to content management.

<h4 class="flex gap-2 items-center [&_svg]:size-5 [&_svg]:text-purple-500">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grid2x2-plus-icon lucide-grid-2x2-plus"><path d="M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3"/><path d="M16 19h6"/><path d="M19 22v-6"/></svg>
  And More
</h4>

Epos includes a variety of built-in utilities designed to streamline the extension development lifecycle. Each feature is pre-configured to function across all execution contexts without additional setup.

You can find the complete list of capabilities in the [API Reference](/api/).
-->

```

```
