# Messaging

Epos provides a powerful messaging system called `bus`. It is designed to replace `chrome.runtime.sendMessage` and other related APIs with a **unified interface** for cross-context communication.

With `bus`, you do not have to worry about internal routing. Epos delivers messages from any context to any other context.

::: info Why “bus”?

[In computing](<https://en.wikipedia.org/wiki/Bus_(computing)>), a **bus** is not a vehicle, but a communication system that transfers data between different components. It acts as a **centralized hub** for exchanging messages.

:::

## Basic Usage

The `bus` API is consistent across every part of your extension. Whether you are in a background script, a popup, web page, or even an iframe, the methods work exactly the same.

#### Listening for Messages

Use `epos.bus.on()` to register a listener for a specific message type (event). To send data back, simply **return a value** (or a Promise) from the handler.

::: code-group

```ts [background.js]
epos.bus.on('getUserData', async userId => {
  const user = await fetchUserData(userId)
  return user
})
```

:::

#### Sending Messages

::: code-group

```tsx {1-3} [src/main.tsx]
const sendMessage = (value: string) => {
  epos.bus.send('message-name', value)
}

const App = () => {
  const [value, setValue] = useState('')
  return (
    <div>
      <input value={value} onChange={e => setValue(e.target.value)} />
      <button onClick={() => sendMessage(value)}>Send Message</button>
    </div>
  )
}

epos.render(<App />)
```

```ts [src/background.ts]
epos.bus.on('message-name', (...data) => {
  console.log('Received in background:', data)
})
```

```json [epos.json]
{
  "name": "My Extension",
  "targets": [
    {
      "matches": "*://*.example.com/*",
      "load": ["dist/main.css", "dist/main.js"]
    },
    {
      "matches": "<background>",
      "load": ["dist/background.js"]
    }
  ]
}
```

:::

#### Binary Data Support

Standard extension messaging is limited to JSON-serializable data, which means it does not support **Blob** or **File** objects. If you want to transfer binary data the "standard" way, you are forced to manually serialize it into a Base64 string — a process that is slow, memory-intensive, and increases payload size.

The Epos `bus` natively supports **Blob** objects. It uses a smarter transfer logic that avoids Base64 serialization entirely, allowing you to move files, images, or any large binary data across contexts without the performance overhead.

::: info

You can learn more about how `bus` works, its features and capabilities in the [API Reference](/api/bus).

:::

The engine handles the **routing automatically** across all contexts, meaning you no longer have to juggle with `chrome.runtime.sendMessage`, `chrome.tabs.sendMessage`, and `window.postMessage`. Just broadcast the message, and Epos ensures it arrives.

---

```ts
// background.js
epos.bus.on('message-name', (...data) => {
  console.log('Received in background:', data)
})

// injected-script.js
epos.bus.on('message-name', (...data) => {
  console.log('Received in injected script:', data)
})

// popup.js
epos.bus.send('message-name', ...data)
```

TODO: describe how return value can be used.

Bus is extremely powerful. It automatically understands how messages should be routed based on the context they are sent from and received in. There is no need to manually juggle with `chrome.runtime.sendMessage`, `chrome.tabs.sendMessage` or `window.postMessage` APIs.

Additionally, bus allows you to send [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) objects. So you can send files, images and video between contexts. Usual `chrome.runtime.sendMessage` does not allow blobs and Epos uses some hard-engineered magic to make it work. You can read more about it and other supported data types in the [Bus API reference](/api/bus#sending-blobs).

Bus sends messages only to other contexts and does not send messages to its own context. If you want in-context communication using bus, you can use `epos.bus.emit` instead:

```ts
// content.js
epos.bus.on('in-context-event', (...data) => {
  console.log('Received in content:', data)
})
epos.bus.emit('in-context-event', ...data)
```

## TypeScript for Bus

To have type safety when using Bus messages, you can use generics provided by `epos.bus` API:

For simple retunr type, you can use it like this:

```ts
const value = await epos.bus.send<number>('some-event') // value is number
```

But for more complex scenarios, you can use a "remote" function type instead:

```ts
// background.js
export function getUser(userId: string) {
  const userData = ... // get user data from API
  return userData
}
epos.bus.on('get-user', getUser)

// popup.js
import type { getUser } from './background'

// Now we have full type safety for getUser function, including its parameters and return type
const user = await epos.bus.send<typeof getUser>('get-user', '123')
```

This way, you can have full type safety for your bus messages, which is especially useful when you have complex data structures or want to ensure that the data being sent and received is of the correct type.

## Bus as RPC

In some cases though, you want to "expose" some objects to other contexts. For example:

```ts
// background.ts
export const userApi = {
  getUser() {},
  updateUser() {},
}
```

With regular bus api, if you want to expose api.getUser and api.updateUser functions to other contexts, you would need to create 2 separate bus messages for each function:

::: code-group

```ts [background.ts]
export const userApi = {
  getUser() {},
  updateUser() {},
}

epos.bus.on('userApi.getUser', userApi.getUser)
epos.bus.on('userApi.updateUser', userApi.updateUser)
```

:::

This approach works, but it can quickly become unmanageable as your API grows. You would need to create a separate bus message for each function, which can lead to a lot of boilerplate code.

To solve this problem, Epos provides a special `epos.bus.register` API that allows you to register an entire object as a remote API with just one line of code:

::: code-group

```ts [background.ts]
export const userApi = {
  getUser() {},
  updateUser() {},
}

epos.bus.register('userApi', userApi)
```

:::

And then you can use this api in other contexts using `epos.bus.use` method:

::: code-group

```ts [popup.ts]
import type { userApi } from './background'

const userApi = await epos.bus.use<typeof userApi>('userApi')

// Use api directly, full type safety for both parameters and return types
const user = await userApi.getUser()
await userApi.updateUser(user)
```

:::
