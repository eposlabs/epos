---
outline: [2, 3]
---

# Bus API

The event bus enables cross-context communication in your extension. It allows you to send messages between popup, side panel, background, content scripts, and iframes seamlessly.

## epos.bus.on()

Register an event listener.

```ts
epos.bus.on<T extends Function>(
  name: string,
  callback: T,
  thisArg?: unknown
): void
```

### Parameters

- `name` - Event name
- `callback` - Function to call when event is triggered
- `thisArg` - Optional `this` context for the callback

### Example

```ts
// Listen for a custom event
epos.bus.on('user:login', (userId: string) => {
  console.log('User logged in:', userId)
})

// With this context
class MyClass {
  handleLogin(userId: string) {
    console.log('User logged in:', userId)
  }

  init() {
    epos.bus.on('user:login', this.handleLogin, this)
  }
}
```

## epos.bus.off()

Remove an event listener.

```ts
epos.bus.off<T extends Function>(
  name: string,
  callback?: T
): void
```

### Parameters

- `name` - Event name
- `callback` - Optional specific callback to remove. If not provided, removes all listeners for this event

### Example

```ts
const handler = (data: string) => {
  console.log('Data:', data)
}

// Register
epos.bus.on('data:update', handler)

// Remove specific handler
epos.bus.off('data:update', handler)

// Remove all handlers for this event
epos.bus.off('data:update')
```

## epos.bus.once()

Register a one-time event listener that automatically removes itself after being called.

```ts
epos.bus.once<T extends Function>(
  name: string,
  callback: T,
  thisArg?: unknown
): void
```

### Parameters

- `name` - Event name
- `callback` - Function to call once when event is triggered
- `thisArg` - Optional `this` context for the callback

### Example

```ts
// Listen once for initialization
epos.bus.once('app:ready', () => {
  console.log('App is ready!')
  // This handler will be automatically removed after first call
})
```

## epos.bus.send()

Send an event to all remote listeners across all contexts. This is the primary method for cross-context communication.

```ts
epos.bus.send<T>(
  name: string,
  ...args: any[]
): Promise<T | null>
```

### Parameters

- `name` - Event name
- `args` - Arguments to pass to the listeners

### Returns

A Promise that resolves to the result from the first listener that returns a value, or `null` if no listener returns anything.

### Example

```ts
// Send from popup to background
await epos.bus.send('fetch:data', 'https://api.example.com')

// Get response from background
const data = await epos.bus.send<{ users: User[] }>('get:users')
console.log(data.users)

// Send with multiple arguments
await epos.bus.send('log:action', 'click', 'button', { id: 123 })
```

## epos.bus.emit()

Call local listeners for an event. Unlike `send()`, this only triggers listeners in the current context.

```ts
epos.bus.emit<T>(
  name: string,
  ...args: any[]
): Promise<T | null>
```

### Parameters

- `name` - Event name
- `args` - Arguments to pass to the listeners

### Returns

A Promise that resolves to the result from the first listener that returns a value, or `null`.

### Example

```ts
// Register local listener
epos.bus.on('local:update', (data: string) => {
  console.log('Local update:', data)
})

// Trigger only local listeners
await epos.bus.emit('local:update', 'new data')
```

## epos.bus.setSignal()

Set a signal with an optional value. Signals are useful for synchronization across contexts.

```ts
epos.bus.setSignal(name: string, value?: unknown): void
```

### Parameters

- `name` - Signal name
- `value` - Optional value to associate with the signal (defaults to `true`)

### Example

```ts
// Signal that initialization is complete
epos.bus.setSignal('init:complete')

// Signal with data
epos.bus.setSignal('config:loaded', { theme: 'dark', language: 'en' })
```

## epos.bus.waitSignal()

Wait for a signal to be set. Useful for synchronization.

```ts
epos.bus.waitSignal<T>(
  name: string,
  timeout?: number
): Promise<T | null>
```

### Parameters

- `name` - Signal name to wait for
- `timeout` - Optional timeout in milliseconds

### Returns

A Promise that resolves to the signal value when the signal is set, or `null` if the timeout is reached.

### Example

```ts
// Wait for initialization
await epos.bus.waitSignal('init:complete')
console.log('Initialization complete!')

// Wait with timeout (5 seconds)
const config = await epos.bus.waitSignal<Config>('config:loaded', 5000)
if (config) {
  console.log('Config loaded:', config)
} else {
  console.log('Config loading timed out')
}
```

## epos.bus.register()

Register an RPC (Remote Procedure Call) API that can be called from other contexts.

```ts
epos.bus.register(name: string, api: Record<string, any>): void
```

### Parameters

- `name` - API name
- `api` - Object with methods to expose

### Example

```ts
// In background script
const userApi = {
  async getUser(id: string) {
    return await fetchUser(id)
  },

  async updateUser(id: string, data: UserData) {
    return await updateUser(id, data)
  },
}

epos.bus.register('user', userApi)
```

## epos.bus.unregister()

Unregister an RPC API.

```ts
epos.bus.unregister(name: string): void
```

### Parameters

- `name` - API name to unregister

### Example

```ts
epos.bus.unregister('user')
```

## epos.bus.use()

Get a typed proxy for calling a remote RPC API. All methods return Promises.

```ts
epos.bus.use<T>(name: string): Rpc<T>
```

### Parameters

- `name` - API name to use

### Returns

A proxy object where all methods are async versions of the registered API methods.

### Example

```ts
// Define API type
interface UserApi {
  getUser(id: string): Promise<User>
  updateUser(id: string, data: UserData): Promise<User>
}

// In popup or content script
const userApi = epos.bus.use<UserApi>('user')

// Call remote methods (they automatically become async)
const user = await userApi.getUser('123')
const updated = await userApi.updateUser('123', { name: 'John' })
```

## epos.bus.for()

Create a namespaced bus instance for organizing events and avoiding naming conflicts.

```ts
epos.bus.for(namespace: string): {
  on: Function
  off: Function
  once: Function
  send: Function
  emit: Function
  setSignal: Function
  waitSignal: Function
  register: Function
  unregister: Function
  use: Function
  dispose: Function
}
```

### Parameters

- `namespace` - Namespace for the bus instance

### Returns

A namespaced bus with all standard methods plus a `dispose()` method.

### Example

```ts
// Create namespaced bus
const chatBus = epos.bus.for('chat')

// All events are automatically prefixed
chatBus.on('message', (msg: string) => {
  console.log('Chat message:', msg)
})

chatBus.send('message', 'Hello!')

// Clean up when done
chatBus.dispose()
```

## Communication Patterns

### Request-Response Pattern

```ts
// Background script
epos.bus.on('fetch:url', async (url: string) => {
  const response = await fetch(url)
  return await response.json()
})

// Content script
const data = await epos.bus.send('fetch:url', 'https://api.example.com')
```

### RPC Pattern

```ts
// Background script
epos.bus.register('api', {
  async getData() {
    return data
  },
  async setData(value) {
    data = value
  },
})

// Content script
const api = epos.bus.use<{
  getData(): Promise<any>
  setData(value: any): Promise<void>
}>('api')

await api.setData({ foo: 'bar' })
const result = await api.getData()
```

### Signal Pattern

```ts
// Wait for initialization in popup
await epos.bus.waitSignal('background:ready', 5000)

// Do work...

// Signal completion in background
epos.bus.setSignal('background:ready')
```

::: tip
Use `epos.bus.for()` to create isolated namespaces for different features or modules to avoid event name conflicts.
:::
