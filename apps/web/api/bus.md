::: warning

This is AI-generated draft based on Epos source code. Proper documentation is coming soon.

:::

# epos.bus.\*

`epos.bus` is the cross-context messaging layer used by Epos.

It can send messages between popup, side panel, background, web pages, and iframes.

## epos.bus.on()

```ts
epos.bus.on<T extends Fn>(name: string, callback: T, thisArg?: unknown): void
```

Registers a listener for an event name.

### Notes

- The optional `thisArg` is used as the callback context.
- `on()` registers a listener in the current context.
- Remote delivery happens through `send()`, not through `on()` itself.

### Example

```ts
epos.bus.on('user:get', (id: string) => {
  return { id }
})
```

## epos.bus.off()

```ts
epos.bus.off<T extends Fn>(name: string, callback?: T): void
```

Removes listeners for an event name.

### Notes

- If `callback` is omitted, all local listeners for that event name are removed.

## epos.bus.once()

```ts
epos.bus.once<T extends Fn>(name: string, callback: T, thisArg?: unknown): void
```

Registers a listener that removes itself after the first call.

## epos.bus.send()

```ts
epos.bus.send<T>(name: string, ...args: FnArgsOrArr<T>): Promise<FnResultOrValue<T> | undefined>
```

Sends an event to remote listeners.

### Notes

- `send()` does not call listeners in the current context.
- The Promise resolves to the first non-`undefined` value returned by any remote listener.
- If no remote listener returns a value, the result is `undefined`.
- If a remote listener throws, the error is rethrown on the sender side.

### Example

```ts
// background.ts
epos.bus.on('sum', (a: number, b: number) => a + b)

// popup.ts
const total = await epos.bus.send<number>('sum', 5, 10)
```

### Type-safe form

```ts
export const sum = (a: number, b: number) => a + b

epos.bus.on('sum', sum)

const total = await epos.bus.send<typeof sum>('sum', 5, 10)
```

## epos.bus.emit()

```ts
epos.bus.emit<T>(name: string, ...args: FnArgsOrArr<T>): Promise<FnResultOrValue<T> | undefined>
```

Calls listeners only in the current context.

### Notes

- `emit()` never sends the event to other contexts.
- Like `send()`, it resolves to the first non-`undefined` return value.

## epos.bus.setSignal()

```ts
epos.bus.setSignal(name: string, value?: unknown): void
```

Publishes a named signal.

### Notes

- If `value` is omitted, the signal value is `true`.
- Signals are useful for one-time readiness points such as `background:ready`.

## epos.bus.waitSignal()

```ts
epos.bus.waitSignal<T>(name: string, timeout?: number): Promise<T | undefined>
```

Waits for a named signal.

### Notes

- `waitSignal()` checks for an already-published signal and also waits for future ones.
- If `timeout` is provided and the signal does not arrive in time, the result is `undefined`.

### Example

```ts
const config = await epos.bus.waitSignal<{ theme: string }>('config:ready', 5000)
```

## epos.bus.register()

```ts
epos.bus.register(name: string, api: RpcTarget): void
```

Registers an RPC-style API object.

### Notes

- Each method of the object becomes callable through `epos.bus.use(name)`.
- Registering the same name more than once is ignored.

### Example

```ts
epos.bus.register('math', {
  sum(a: number, b: number) {
    return a + b
  },
})
```

## epos.bus.unregister()

```ts
epos.bus.unregister(name: string): void
```

Removes an RPC API previously registered with `register()`.

## epos.bus.use()

```ts
epos.bus.use<T extends RpcTarget>(name: string): Rpc<T>
```

Returns an RPC client proxy.

### Example

```ts
const math = epos.bus.use<{ sum(a: number, b: number): number }>('math')
const total = await math.sum(5, 10)
```

## epos.bus.for()

```ts
epos.bus.for(namespace: string): Omit<EposBus, 'for'> & { dispose(): void }
```

Creates a namespaced bus instance.

### Notes

- All event names and RPC ids are prefixed internally.
- This is useful for modules that want private event names.
- `dispose()` removes all listeners registered through that namespaced instance.
- After `dispose()`, most calls become no-ops, and `use()` throws.

### Example

```ts
const userBus = epos.bus.for('user')

userBus.on('updated', user => {
  console.log(user)
})

await userBus.send('updated', { id: '42' })
```
