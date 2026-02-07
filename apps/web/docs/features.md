---
outline: [2]
---

# Features

Epos is packed with built-in features designed to streamline the extension development lifecycle. Each feature is pre-configured to function across all execution contexts without additional setup.

## Universal Messaging

Epos provides an out-of-the-box messaging system that "just works". It's like `chrome.runtime.sendMessage`, but **10x better**.

Simply call `epos.bus.send` from any context, and Epos will deliver the message to all `epos.bus.on` listeners — no matter where they are. You don't need to worry about tracking tab IDs or proxying messages with `window.postMessage`; the engine handles the routing automatically across the entire extension.

## Auto-Sync State

Define and modify your state as a standard JavaScript object. Epos **automatically persists and synchronizes** every change across all extension contexts. When the state updates, your React components re-render automatically.

```ts
// Connect to the state using { value: 10 } as the initial value
const state = await epos.state.connect({ value: 10 })

// Update like a regular JS object; all changes are automatically
// persisted and synced across all contexts
state.value = 20
```

## Chrome API, Everywhere

Standard `chrome.*` APIs are restricted to specific extension contexts. Epos removes these boundaries, allowing you to call Extension APIs via `epos.browser.*` from **any** context — including regular web pages.

## Storage

Epos provides a built-in storage system for files and data. It acts as a smart wrapper around **IndexedDB**, offering a simple key-value API that works across all extension contexts with zero setup required.

```ts
// popup.js
await epos.storage.set('my-image', image)

// injection.js
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
      "load": ["injection.js", "injection.css"]
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

## And More

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
