---
outline: [2]
---

# Features

Epos is packed with built-in tools designed to streamline the extension development lifecycle. Each tool is pre-configured to function across all execution contexts without additional setup.

Below are some of the core features that make Epos unique. You can find the complete list of capabilities in the [API Reference](/docs/api).

## Messaging System

Epos provides a built-in, unified messaging system called `bus`. It's like `chrome.runtime.sendMessage`, but **10x better**.

Simply call `epos.bus.send` from any context, and Epos will deliver the message to every `epos.bus.on` listener — no matter where they are located.

The engine handles the **routing automatically** across all contexts, meaning you no longer have to juggle with `chrome.runtime.sendMessage`, `chrome.tabs.sendMessage`, and `window.postMessage`. Just broadcast the message, and Epos ensures it arrives.

Every `epos.bus.on` listener can return a value, which will be sent back to the sender as a resolved promise. This allows you to implement request-response patterns with ease.

```ts
// background.js
epos.bus.on('getUserData', async userId => {
  const user = await fetchUserData(userId)
  return user // This value is sent back to the caller
})

// injected-script.js
const user = await epos.bus.send('getUserData', 123)
```

#### Binary Data Support

Standard extension messaging is limited to JSON-serializable data, which means it does not support **Blob** or **File** objects. If you want to transfer binary data the "standard" way, you are forced to manually serialize it into a Base64 string — a process that is slow, memory-intensive, and increases payload size.

The Epos `bus` natively supports **Blob** objects. It uses a smarter transfer logic that avoids Base64 serialization entirely, allowing you to move files, images, or any large binary data across contexts without the performance overhead.

::: info

You can learn more about how `bus` works, its features and capabilities in the [API Reference](/docs/api-bus).

:::

## State Management

With `epos.state` API you can connect to the state and work with it like a regular JavaScript object. Epos **automatically persists and synchronizes** every change across all extension contexts. And react components with also react to any changes and keep your UI in sync with the state.

TODO: mention IDB for persistence.

Epos provides state management which allows you to work with a state like with a regular JavaScript object. Epos **automatically persists and synchronizes** every change across all extension contexts. When the state updates, your React components re-render automatically.

```ts
// Connect to the state using { value: 10, items: [] } as the initial value
const state = await epos.state.connect({ value: 10, items: [] })

// Update like a regular JS object.
// Every change is automatically persisted and synced across all contexts!
state.value = 20
state.items.push({ id: 1, name: 'Item 1' })
```

## Chrome APIs

Standard `chrome.*` APIs can be called only from special extension contexts. Epos removes these boundaries, allowing you to call Extension APIs via `epos.browser.*` from **any** context — including regular web pages.

```ts
// injected-script.js on https://example.com
const tabs = await epos.browser.tabs.query({})
// Works! Even though we are executing the code on a regular web page
// without direct access to chrome.* APIs
```

## Storage

Epos provides a built-in storage system for files and data. It acts as a smart wrapper around **IndexedDB**, offering a simple key-value API that works across all extension contexts with zero setup required.

```ts
// popup.js
await epos.storage.set('my-image', image)

// injected-script.js
const image = await epos.storage.get('my-image')
```

## Simplified Setup

Just tell Epos **what** files to load and **where** — it handles the rest. Epos abstracts the complexity of manual script injection or the technical differences between "isolated" and "main world" content scripts.

::: code-group

```json [epos.json]
{
  "name": "My Extension",
  "targets": [
    {
      "matches": "*://*.example.com/*",
      "load": ["content-script.js", "content-script.css"]
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

You can find the complete list of capabilities in the [API Reference](/docs/api.html).

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

You can find the complete list of capabilities in the [API Reference](/docs/api.html).
-->

```

```
