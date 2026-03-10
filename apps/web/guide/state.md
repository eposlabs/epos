# State Management

`epos.state` gives you a shared object that is persisted and synchronized across extension contexts. You can change it like normal JavaScript data, and Epos handles the rest for you.

If your background changes state data, your popup will reflect that change immediately. If the user closes the extension or restarts the browser, the data is restored the next time they open it.

This guide focuses on the practical side of the API. For the full method list, see the [State API Reference](/api/state).

## Connect to State

To start, connect to the default state:

```ts
const state = await epos.state.connect()
```

The returned value behaves like a normal object, but it is automatically synced and persisted:

```ts
const state = await epos.state.connect()

// Modify like a normal object
state.count = 1
state.items = []
state.items.push('Hello')
```

## It Is a Proxy

While state feels like a normal object, it is actually a [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) that tracks changes for you.

Most of the time, there is no visible difference. Working with the proxy feels like working with a normal object.

It only becomes noticeable when you inspect the value in DevTools.

## Inspecting State

To make debugging easier, every state object and array has a special `_` getter that returns a plain JavaScript snapshot.

```ts
const state = await epos.state.connect()

state.user = {
  name: 'Alice',
  tags: ['admin', 'beta'],
}

console.log(state._)
console.log(state.user._)
console.log(state.user.tags._)
```

This is useful for inspection only. Changing `state._` does not change the real state.

## Initial State

You can pass an initial value when connecting:

```ts
const state = await epos.state.connect({
  count: 0,
  user: null,
})
```

This initial value is used only when the state does not already exist. If data is already stored, Epos will use the stored data.

## React Usage

`epos.state` works naturally with React. The rule is simple: wrap components with `epos.component()` so they react to state changes.

```tsx
const state = await epos.state.connect({ count: 0 })

const Counter = epos.component(() => {
  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => state.count++}>Increment</button>
    </div>
  )
})

epos.render(<Counter />)
```

When `state.count` changes in any context, the `Counter` component reflects that change immediately.

## Multiple States

For most projects, one shared state is enough. If you want to separate different kinds of data, you can create named states:

```ts
const appState = await epos.state.connect({ count: 0 })
const cacheState = await epos.state.connect('cache', { users: [] })
const settingsState = await epos.state.connect('settings', { theme: 'dark' })
```

## Transactions

You can change the state line by line, and that is completely fine:

```ts
state.count += 1
state.user = { name: 'Alice' }
state.items.push('New item')
```

Just remember that every change triggers synchronization. To reduce the overhead, use `transaction()` to batch several changes together:

```ts
epos.state.transaction(() => {
  state.count += 1
  state.user = { name: 'Alice' }
  state.items.push('New item')
})
```

This way only one synchronization event is triggered, and the update behaves like a single operation.

::: warning

Transactions are synchronous. Do not use `await` inside them.

:::

::: warning

If your transaction throws halfway through, changes made before the error are **not rolled back**.

:::

## Reactions

If you need to run side effects when state changes, use `epos.state.reaction()`.

It is a direct wrapper around MobX `reaction`, exposed on `epos.state` for convenience.

```ts
const state = await epos.state.connect({ count: 0 })

epos.state.reaction(
  () => state.count,
  count => {
    console.log('Count changed:', count)
  },
)
```

This is useful when you need to react to state changes.

Read more about `reaction` in the [official MobX docs](https://mobx.js.org/reactions.html#reaction).

## Local State

Not every piece of data should be shared across contexts. For local state, use `local()`:

```ts
const localState = epos.state.local({ selected: false })

localState.selected = true
```

Local state is reactive, so React components wrapped with `epos.component()` will update when it changes. You can also watch it with `reaction()`. Unlike shared state, local state is not synchronized across contexts and is not persisted.

## Versioning and Migrations

As your app grows, the state shape may change. `connect()` accepts a versioner object so you can migrate old data.

Let's say you have this default state:

```ts
const state = await epos.state.connect({ theme: 'light' })
```

But later you added a new `language` field:

```ts
const state = await epos.state.connect({ theme: 'light', language: 'en' })
```

New users will get the new field, but existing users will not, because their state is already stored. To fix that, add a versioner:

```ts
const state = await epos.state.connect(
  { theme: 'light', language: 'en' },
  {
    1(s) {
      s.language = 'en'
    },
  },
)
```

You can have any number of migration functions. Each key must be a number that represents a version. The current state version is stored under the `:version` key. When `connect()` runs, Epos checks the stored version and applies all newer migrations in order.

Inside a migration function, you can modify the state in any normal way. You can assign properties, `push()` or `splice()` arrays, and use `delete` when needed.

## Models

State can store plain objects and arrays, but it can also work with classes. These classes are called **models**.

Define a model like a regular JavaScript class:

```ts
class User {
  firstName: string
  lastName: string

  constructor(firstName: string, lastName: string) {
    this.firstName = firstName
    this.lastName = lastName
  }

  fullName() {
    return `${this.firstName} ${this.lastName}`
  }
}
```

And register it with `epos.state.register()`:

```ts
// Register User class as "User" model
epos.state.register({ User })

// Alternatively, you can specify a custom model name
epos.state.register({ Profile: User })
```

It is important to register models _before_ connecting to state. Otherwise, Epos will not be able to restore them.

```ts
// Register first
epos.state.register({ User })

// Then connect
const state = await epos.state.connect()

// Now state can accept models
state.user = new User('Alice', 'Smith')
console.log(state.user.fullName()) // Alice Smith
```

When a model instance is stored in state, Epos adds an `@` key to that object. This key stores the model name. In the example above, `user['@'] === 'User'`.

This `@` key is what lets Epos restore the model when the state is loaded from IndexedDB. It tells Epos which model to apply to that stored object. That is why models must be registered before connecting to state. If a model is missing, Epos throws an error by default. You can change that behavior by setting `options.allowMissingModels: true` in `epos.json`.

## Model Lifecycle Hooks

Epos also exposes a few symbols for more advanced model work:

- `epos.state.PARENT` lets you access a parent object or array.
- `epos.state.ATTACH` runs when the object is attached to state.
- `epos.state.DETACH` runs when the object is removed from state.

Example:

```ts
class TodoItem {
  text: string

  constructor(text: string) {
    this.text = text
  }

  [epos.state.ATTACH]() {
    console.log('Added to state')
  }

  [epos.state.DETACH]() {
    console.log('Removed from state')
  }
}

epos.state.register({ TodoItem })
const state = await epos.state.connect({ todos: [] })
state.todos.push(new TodoItem('Learn Epos')) // Logs "Added to state"
state.todos[epos.state.PARENT] === state // true
state.todos[0][epos.state.PARENT] === state.todos // true
state.todos.pop() // Logs "Removed from state"
```

This is advanced usage for building custom models on top of Epos state.

## Disconnecting State

`disconnect()` stops the sync connection for a state but does not delete its stored data:

```ts
const state = await epos.state.connect({ count: 0 })
state.count += 1 // Synced
epos.state.disconnect()
state.count += 1 // Not synced, but still changes locally
```

You can also pass a state name if you want to disconnect a named state:

```ts
epos.state.disconnect('settings')
```

## Removing State

`remove()` permanently deletes a state and its stored data:

```ts
await epos.state.remove() // Remove default state
await epos.state.remove('cache') // Remove "cache" state
```

Use `remove()` carefully. It permanently deletes all data, and the operation cannot be undone.

## Listing States

`list()` shows information about existing states and whether they are currently connected:

```ts
const states = await epos.state.list()
console.log(states) // Array<{ name: string | null, connected: boolean }>
```

For the default state, `name` is `null`.

## Under the Hood

Epos state is built on top of [MobX](https://mobx.js.org/) and [Yjs](https://yjs.dev/).

- MobX handles reactivity.
- Yjs handles conflict resolution.

You do not need to know either library to use `epos.state`.

But if you are already familiar with MobX, you can still use its APIs on state objects. For example:

```ts
import { autorun } from 'mobx'

const state = await epos.state.connect({ count: 0 })
autorun(() => console.log(`Count is ${state.count}`))
```
