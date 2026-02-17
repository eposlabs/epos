# Messaging

Epos provides a simple and powerful event bus system that allows for cross-context communication in your app. It provides a simple interface for sending messages from any context to any other context (popup, side panel, background, web page, iframe).

::: info Why “bus”?

[In computing](<https://en.wikipedia.org/wiki/Bus_(computing)>), a **bus** is not a vehicle, but a communication system that transfers data between different components. It acts as a centralized hub for exchanging messages.

:::

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

Additionally, bus allows you to send [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) objects. So you can send files, images and video between contexts. Usual `chrome.runtime.sendMessage` does not allow blobs and Epos uses some hard-engineered magic to make it work. You can read more about it and other supported data types in the [Bus API reference](/docs/api-bus#sending-blobs).

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
