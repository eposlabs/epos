# Messaging

`epos.bus` is the messaging layer used to communicate between extension contexts. You can use the same API in the popup, background, side panel, web page, or iframes.

The simple mental model is this:

- `epos.bus.on()` listens for a message.
- `epos.bus.send()` sends a message to other contexts.
- `epos.bus.off()` removes a listener.

::: info Why “bus”?

[In computing](<https://en.wikipedia.org/wiki/Bus_(computing)>), a bus is not a vehicle, but a communication system that transfers data between different components. It acts as a centralized hub for exchanging messages.

:::

## Why Use `epos.bus`?

Browser extensions often need different messaging APIs, depending on where a message starts and where it needs to go.

`epos.bus` gives you one API for all of those cases. Instead of switching between `chrome.runtime.sendMessage`, `chrome.tabs.sendMessage`, and `window.postMessage`, you use the same methods everywhere and let Epos handle the routing.

## Basics

The most common pattern is one context listening and another context sending.

In this example, the background listens for `analytics:event`, and the popup sends it:

::: code-group

```ts [background.ts]
epos.bus.on('analytics:event', eventName => {
  console.log('Analytics event received:', eventName)
})
```

<!-- prettier-ignore -->
```tsx [popup.tsx]
const App = () => {
  return (
    <button onClick={() => epos.bus.send('analytics:event', 'save')}>
      Save
    </button>
  )
}

epos.render(<App />)
```

```json [epos.json]
{
  "name": "My Extension",
  "targets": [
    {
      "matches": "<popup>",
      "load": ["dist/popup.js"]
    },
    {
      "matches": "<background>",
      "load": ["dist/background.js"]
    }
  ]
}
```

:::

That is the most common pattern. You pick an event name, attach a listener with `on()`, and send data with `send()`.

## Returning Data

`epos.bus.send()` is not only for fire-and-forget events. If a listener returns a value, the sender receives it back.

This works well for request-response flows:

```ts
// background.ts
epos.bus.on('user:get', async (userId: string) => {
  const response = await fetch(`https://api.example.com/users/${userId}`)
  return await response.json()
})

// popup.tsx
const user = await epos.bus.send<User>('user:get', '42')
console.log(user)
```

If no listener responds, `send()` resolves to `undefined`.

## Local Events with `emit()`

`epos.bus.send()` does not call listeners in the current context. It is meant for sending messages to other contexts.

To trigger local listeners, use `epos.bus.emit()` instead:

::: code-group

```ts [popup.tsx]
epos.bus.on('modal:close', () => {
  console.log('Close modal')
})

await epos.bus.emit('modal:close')
```

:::

This is useful for local coordination when you do not need cross-context delivery.

## Removing Listeners

Use `epos.bus.off()` when a listener should stop receiving messages.

::: code-group

```ts [popup.tsx]
const handleUpdate = (value: number) => {
  console.log('Updated:', value)
}

epos.bus.on('counter:update', handleUpdate)

// Later
epos.bus.off('counter:update', handleUpdate)
```

:::

If you call `off()` without a callback, Epos removes all listeners for that event name in the current context.

## One-Time Listeners

Sometimes an event should be handled only once. In that case, use `epos.bus.once()`:

::: code-group

```ts [popup.tsx]
epos.bus.once('auth:ready', () => {
  console.log('Auth is ready')
})
```

:::

After the first call, the listener is removed automatically.

## Waiting for Readiness

For startup flows, it is common to wait until another context finishes some work. `epos.bus.setSignal()` and `epos.bus.waitSignal()` are made for that.

For example, your popup may need to wait until the background loads configuration:

```ts
// background.ts
const config = await loadConfig()
epos.bus.setSignal('config:ready', config)

// popup.tsx
const config = await epos.bus.waitSignal<Config>('config:ready')
console.log(config)
```

By default, `waitSignal()` waits indefinitely. You can also pass a timeout in milliseconds. If the signal is not set within that time, it resolves to `undefined`:

```ts
// Resolves to `undefined` if config is not ready within 5 seconds
const config = await epos.bus.waitSignal<Config>('config:ready', 5000)
```

## Type Safety

If you are using TypeScript, `send()` can be typed in two ways.

1. For a simple return value, pass the expected result type:

```ts
const total = await epos.bus.send<number>('math:sum', 5, 10)
```

2. If you also want argument checking, pass a function type:

::: code-group

```ts [popup.tsx]
import type { sum } from './background'

const total = await epos.bus.send<typeof sum>('math:sum', 5, 10)
```

```ts [background.ts]
export const sum = (a: number, b: number) => a + b

epos.bus.on('math:sum', sum)
```

:::

This keeps the event name string-based, while still giving you solid TypeScript support.

## Exposing APIs

If you have many related methods, exposing them all through `epos.bus.on()` can get tedious:

::: code-group

```ts [background.ts]
export const userApi = {
  getUser () { ... },
  updateUser () { ... },
  removeUser () { ... },
  // ... 10 more methods
}

epos.bus.on('user:get', userApi.getUser, userApi)
epos.bus.on('user:update', userApi.updateUser, userApi)
epos.bus.on('user:remove', userApi.removeUser, userApi)
// ... 10 more listeners
```

:::

::: tip

The third argument of `epos.bus.on()` sets `this` for the listener, so you do not need to `bind()` manually.

:::

To expose all methods at once, you can `register()` the API object and make it available to other contexts:

::: code-group

```ts [background.ts]
export const userApi = { ... }

epos.bus.register('user', userApi)
```

:::

Then, in another context, you can `use()` that API by name:

::: code-group

```ts [popup.tsx]
import type { userApi } from './background'

const userApi = epos.bus.use<typeof userApi>('user')
const user = await userApi.getUser('42')
```

:::

Notice that `epos.bus.use()` returns the API object immediately. You do not `await` it.

You also get full type safety for the API methods.

If the API should no longer be available, you can unregister it later with `epos.bus.unregister('user')`.

## Namespaces with `for()`

On larger projects, event names can start to collide. `epos.bus.for()` solves that by creating a namespaced version of the bus:

```ts
const chatBus = epos.bus.for('chat')

chatBus.on('message', text => {
  console.log('Chat message:', text)
})

// In another context
await chatBus.send('message', 'Hello')
```

The namespaced bus has all the methods of the normal `epos.bus` API. It also has a `dispose()` method that removes all listeners registered through it.

## Sending Blobs

`epos.bus` is not limited to JSON data. You can safely transfer `Blob` objects between contexts. This is useful when you work with images, files, or other binary data.

```ts
// popup.ts
await epos.bus.send('file:save', imageBlob)

// background.ts
epos.bus.on('file:save', async (blob: Blob) => {
  console.log('Save file:', blob.type, blob.size)
})
```

Epos does not serialize blobs as base64 strings. Instead, it uses a more efficient transfer techniques. You can safely send large files between contexts without freezing your app.

## When to Use What

- Use `on()` and `send()` for normal cross-context messaging.
- Use `emit()` for local-only events.
- Use `once()` when an event should be handled a single time.
- Use `setSignal()` and `waitSignal()` for readiness and synchronization.
- Use `register()` and `use()` when you want to expose an API to another context.
- Use `for()` to create a namespaced bus and avoid event name collisions.

If you want the exact signatures, continue to the [Bus API Reference](/api/bus).
