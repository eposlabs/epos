# Bus API

The **Bus API** provides a unified messaging system for communication between all application contexts — such as background, popup, side panel, and tabs.

Why is that called "Bus"? In computer architecture, a bus is a communication system that transfers data between components.

Messaging is a pain point in browser extension development. Each context has its own messaging API with different syntax and semantics.

Unlike Chrome's native messaging with `chrome.runtime.sendMessage` and `chrome.tabs.sendMessage`, **Bus** provides easier-to-use API, in most caases you only need `epos.bus.on` to register listener and `epos.bus.send` to send a message. Epos automatically detects where the listeners are registered and routes the messages accordingly. So you don't need to worry about the context you're in and where you want to send a message.

Supported data types: JSON-serializable, Date, Blob, Error, Uint8Array, Uint16Array, Uint32Array.

## `epos.bus.on`

Register a listener for an event. If `thisValue` is provided, it will be used as `this` for the callback.

**Syntax:**

```ts
epos.bus.on(eventName, callback, thisValue?)
```

**Example**

```ts
epos.bus.on('greet', (firstName, lastName) => {
  console.log(`Hello, ${firstName} ${lastName}!`)
})
```

## `epos.bus.send`

**Syntax:**

```ts
epos.bus.send<T>(eventName, ...args): Promise<T>
```

**Example**

```ts
// popup.js
const data = await epos.bus.send('parse', 'https://example.com')

// background.js
epos.bus.on('parse', async url => {
  const data = await parseUrl(url)
  return data
})
```

Send event to all remote contexts that have listeners for this event. Returns a promise that resolves with the response from the first remote handler that returns a non-null and non-undefined value. If no remote handler returns a value, the promise resolves with `null`.

## `epos.bus.once`

```ts
epos.bus.once(eventName, callback, thisValue?)
```

Same as `epos.bus.on`, but the listener is automatically removed after the first invocation.

## `epos.bus.off`

Remove a listener for an event. If no callback is provided, all listeners for that event are removed.

**Syntax:**

```ts
epos.bus.off(eventName, callback?)
```

## `epos.bus.emit`

```ts
epos.bus.emit<T>(eventName, ...args): Promise<T>
```

Emit an event locally instead of sending it to remote contexts. Returns a promise that resolves with the response from the first local handler that returns a value. Same as with `send`, if no local handler returns a value, the promise resolves with `null`.

## `epos.bus.setSignal`

```ts
epos.bus.setSignal(name, value?)
```

_This is advanced API._

Set a named signal that can be awaited by other parts of the system using `waitSignal`.

## `epos.bus.waitSignal`

```ts
epos.bus.waitSignal<T>(name, timeout?): Promise<T>
```

Wait until a signal with the specified name is set via `setSignal`. Optionally accepts a timeout (in milliseconds).

## Examples

This section provides some useful examples of how to use the Bus API.

### Basic Usage

In most cases you will only need `epos.bus.on` to register a listener and `epos.bus.send` to send a message. Here is how to do it:

```ts
// popup.js
button.addEventListener('click', () => {
  epos.bus.send('click', 'John', 'Doe', 30)
})

// background.js
epos.bus.on('click', (firstName, lastName, age) => {
  console.log(`User clicked button: ${firstName} ${lastName}, age ${age}`)
})
```

Using response from `send`:

```ts
// popup.js
const user = await epos.bus.send('getUser')
console.log('User data:', user)

// background.js
epos.bus.on('getUser', () => {
  return { id: 1, name: 'Alice' }
})
```

In some cases you might need to call local listeners, you can use `emit` in this case:

```ts
// background.js
epos.bus.on('log', message => console.log(message))
await epos.bus.emit('log', 'This is a log message') // Will call local listener only, popup won't log anything

// popup.js
epos.bus.on('log', message => console.log(message))
```

## `epos.bus.send`

Sends an event to **remote contexts** (for example, from popup to background or from tab to service worker).
Local listeners are **not triggered**.
Returns a `Promise` that resolves with the response from the first remote handler that returns a value.

**Usage**

```ts
epos.bus.send<T = unknown>(eventName, ...args): Promise<T>
```

**Example**

```ts
// From popup
const user = await epos.bus.send('getUser')
console.log('User data:', user)
```

## `epos.bus.emit`

Emits an event **locally only** — useful for internal UI or in-context communication.

**Usage**

```ts
epos.bus.emit<T = unknown>(eventName, ...args): Promise<T>
```

**Example**

```ts
epos.bus.emit('ui:refresh')
```

## `epos.bus.setSignal`

Sets a named signal that can be awaited by other parts of the system using `waitSignal`.
Signals act like lightweight synchronization points between async processes.

**Usage**

```ts
epos.bus.setSignal(name, value?)
```

**Example**

```ts
epos.bus.setSignal('initialized')
```

## `epos.bus.waitSignal`

Waits until a signal with the specified name is set via `setSignal`.
Optionally accepts a timeout (in milliseconds).

**Usage**

```ts
epos.bus.waitSignal<T>(name, timeout?): Promise<T>
```

**Example**

```ts
await epos.bus.waitSignal('initialized')
console.log('Initialization complete')
```

---

Together, these APIs form the backbone of **inter-context communication** in Epos, allowing messages, events, and synchronization to flow seamlessly between every part of your extension.
