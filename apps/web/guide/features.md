# Features

Epos comes with a set of high-level tools preconfigured to work across all execution contexts without any additional setup.

This page is only a quick overview. Each feature has its own guide and API reference if you want the full details.

## Messaging

`epos.bus` is the messaging layer used to talk between popup, background, side panel, web pages, and iframes.

It is like `chrome.runtime.sendMessage` but works across all contexts.

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

You do not need to switch between several different messaging APIs depending on the context and worry about the routing. Epos handles all of that for you.

Read more in the [Messaging](/guide/messaging) guide.

## Shared State

`epos.state` gives you a shared object that is synchronized across contexts and persisted between sessions.

```ts
// Connect to a shared state
const state = await epos.state.connect({ count: 0, items: [] })

// Modify as a normal object, changes are synced and persisted
state.count += 1
state.items.push('Hello')
```

In React, wrap components with `epos.component()` and they will react to state changes automatically.

Read more in the [State Management](/guide/state) guide.

## Chrome APIs Everywhere

`epos.browser.*` mirrors `chrome.*` APIs and make them available in all contexts, including web pages and iframes.

```ts
// content-script.ts
const tabs = await epos.browser.tabs.query({})
```

This is especially useful on web pages and in iframes, where standard extension APIs are unavailable.

## Storage

`epos.storage` is a persistent key-value storage powered by IndexedDB.

```ts
await epos.storage.set('theme', 'dark')
const theme = await epos.storage.get<string>('theme')
```

It also supports files, blobs, and other binary data. Storage is available in all contexts, including web pages and iframes.

Read more in the [Storage](/guide/storage) guide.

## Simpler Project Setup

`epos.json` replaces `manifest.json` and lets you define your extension in a simpler way. Just tell Epos **what** files to load and **where**, and it will handle the rest.

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

Epos turns that configuration into a normal manifest during export.

Read more in the [epos.json](/guide/epos-json) guide.
