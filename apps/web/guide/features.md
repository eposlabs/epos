# Features

Epos comes with a set of high-level features that are preconfigured to work across all execution contexts with no extra setup.

This page is a quick overview of some of them. Each feature has its own guide and API reference if you want the full details.

## Messaging

`epos.bus` is the messaging layer for communication between the popup, background, side panel, web pages, and iframes.

It is like `chrome.runtime.sendMessage`, but much more powerful and easier to use.

```ts
// background.ts
epos.bus.on('user:get', async (userId: string) => {
  return await fetchUser(userId)
})

// popup.ts
const user = await epos.bus.send<User>('user:get', '42')

// content-script.ts
const user = await epos.bus.send<User>('user:get', '42')
```

You do not need to switch between different messaging APIs depending on the context or worry about routing. Epos handles that for you.

Read more in the [Messaging](/guide/messaging) guide.

## Shared State

`epos.state` gives you a shared object that is synchronized across contexts and persisted between sessions.

```ts
// Connect to a shared state
const state = await epos.state.connect()

// Use it like a normal object, changes are synced and persisted
state.count = 10
state.items = []
state.items.push('Hello')
```

In React, wrap components with `epos.component()` and they will update automatically when the state changes.

Read more in the [State Management](/guide/state) guide.

## Storage

`epos.storage` is a persistent key-value store powered by IndexedDB.

```ts
await epos.storage.set('theme', 'dark')
const theme = await epos.storage.get<string>('theme')
```

It also supports files, blobs, and other binary data. It is available in all contexts, including web pages and iframes.

Read more in the [Storage](/guide/storage) guide.

## Extension APIs

`epos.browser.*` mirrors `chrome.*` APIs and makes them available in all contexts.

```ts
// content-script.ts
const tabs = await epos.browser.tabs.query({})
```

You are no longer limited to any context restrictions. Just use `epos.browser` and it will work everywhere.

Read more in the [Extension APIs](/guide/extension) guide.

## Simple Setup

`epos.json` replaces `manifest.json` and lets you define your extension in a simpler way. You tell Epos **which** files to load and **where**, and it handles the rest.

```json
{
  "name": "My Extension",
  "targets": [
    {
      "matches": "<popup>",
      "load": ["dist/popup.js"]
    },
    {
      "matches": "*://*.example.com/*",
      "load": ["dist/main.js", "dist/main.css"]
    }
  ]
}
```

Epos turns that configuration into a standard `manifest.json` during export.

Read more in the [epos.json](/guide/epos-json) guide.
