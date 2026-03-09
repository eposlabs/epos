# State Management

`epos.state` gives you a shared object that is persisted and synchronized across extension contexts. You can change it like normal JavaScript data, and Epos handles the rest for you.

If your background changes state data, your popup will reflect that change immediately. And if a user closes your extension, or restarts the browser, the data will be restored when they open it again.

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

While state feels like a normal object, in reality it is a [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) object that can track any changes.

Most of the time, you can't see any difference, working with a proxy object feels like working with a normal object.

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

`epos.state` works naturally with React. The main rule is simple: wrap components with `epos.component()` so they react to state changes.

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

When `state.count` changes in any context, `Counter` component will reflect that change immediately.

## Multiple States

For most projects, one shared state is usually enough. If you want to separate different kinds of data, you can create named states:

```ts
const appState = await epos.state.connect({ count: 0 })
const cacheState = await epos.state.connect('cache', { users: [] })
const settingsState = await epos.state.connect('settings', { theme: 'dark' })
```

## Transactions

You can change the state line by line and it is totally fine:

```ts
state.count += 1
state.user = { name: 'Alice' }
state.items.push('New item')
```

Just remember that every change triggers a synchronization. To reduce the overhead, use `transaction()` to batch multiple changes together:

```ts
epos.state.transaction(() => {
  state.count += 1
  state.user = { name: 'Alice' }
  state.items.push('New item')
})
```

This way only one synchronization event is triggered, and the update feels like a single operation.

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

This is useful when you need to react on some state changes.

Read more about `reaction` in the [official MobX docs](https://mobx.js.org/reactions.html#reaction).

## Local State

Not every piece of data should be shared across contexts. For local state, use `local()`:

```ts
const localState = epos.state.local({ selected: false })

localState.selected = true
```

This state is reactive, meaning React components wrapped to `epos.component()` will update when it changes, and you can use `reaction()` to watch for changes. But it is not synchronized and not persisted.

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

The new field will be added for the new users, yet existing users will not get it because their state is already stored. To fix this, you need to add a versioner:

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

You can have any number of migration functions, each key must be a number representing the version. Current state version is kept under `:version` key. When `connect()` is called, Epos checks the stored version and runs all migration functions that are newer than existing version.

## Models

State can store plain objects and arrays, but it can also work with classes. These classes are called **models**.

Define model like a regular JavaScript class:

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

// Alternaively you can specify a custom name
epos.state.register({ Person: User })
```

It is important to register models _before_ connecting to state. Otherwise Epos won't be able to restore models.

```ts
epos.state.register({ User })

const state = await epos.state.connect()

state.user = new User('Alice', 'Smith')

console.log(state.user.fullName()) // Alice Smith
```

When model instance is stored in a state, Epos adds `@` key to the model instance. This key holds the model name. So in the example above, `user['@'] === 'User'`.

This `@` key is crucial for restoring the model when the state is initialized from IndexedDB. It tells Epos which model to apply for that stored object. That's why models must be registered before connecting to state. If a model is not registered, Epos will not know how to restore it and will return a plain object instead.

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
    console.log('added to state')
  }

  [epos.state.DETACH]() {
    console.log('removed from state')
  }
}

epos.state.register({ TodoItem })
const state = await epos.state.connect({ todos: [] })
state.todos.push(new TodoItem('Learn Epos')) // logs "added to state"
state.todos[epos.state.PARENT] === state // true
state.todos[0][epos.state.PARENT] === state.todos // true
state.todos.pop() // logs "removed from state"
```

This is advanced usage for creating custom models on top of Epos state. Usually you don't need them.

## Disconnecting, Listing, and Removing

There are a few extra methods worth knowing about.

`disconnect()` stops the sync connection for a state but does not delete its stored data:

```ts
const state = await epos.state.connect({ count: 0 })
epos.state.disconnect()
```

`list()` shows information about existing states and whether they are currently connected:

```ts
const states = await epos.state.list()
console.log(states) // Array<{ name: string | null, connected: boolean }>
```

`remove()` permanently deletes a state and its stored data:

```ts
await epos.state.remove() // Remove default state
await epos.state.remove('cache') // Remove "cache" state
```

Use `remove()` carefully. It permanently deletes all data. The operation cannot be undone.

## Under the Hood

Epos state is built on top of [MobX](https://mobx.js.org/) and [Yjs](https://yjs.dev/).

- MobX handles reactivity.
- Yjs handles conflict resolution.

You do not need to know either library to use `epos.state`.

You can use any MobX API on state objects, for example:

```ts
import { autorun } from 'mobx'

const state = await epos.state.connect({ count: 0 })
autorun(() => console.log(`Count is ${state.count}`))
```

Although it is recommended to stick with `epos.state.reaction()` as it is easier to work with than autoruns or other MobX primitives.
