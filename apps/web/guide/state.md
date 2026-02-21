# State Management

State is probably the most powerful feature of Epos. It is a real magic which probably you have never seen before. It allows you to work with a state just like with a regular JavaScript object, but this object automatically synchronizes across all extension contexts and persists in the background. So if user reopens your extension, all data is still there.

## Connect to State

To start working with a state, you need to connnect to it first. To do so, just use `epos.state.connect()` method:

```ts
const state = await epos.state.connect()
```

This will connect to the default state and return an object that can be modified in any way. Initiially, this object is empty, but if you modify it, all changes will be saved and restored when you re-open the extension. You can place state to `window` and play around in devtools to see how it works:

```ts
const state = await epos.state.connect()
window.state = state
```

As you can see, the state is not actually a regular JavaScript object, instead it is a [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) object that listens to changes to synchronize them and persist.

## Inspecting State

Proxies are a powerful JavaScript feature, but inspecting them in DevTools can be a bit tricky. To make it easier, Epos provides `_` getter for every state object, just type `state._` in DevTools and it will give you a plain JavaScript object with all the data, without any Proxies. Modifying this object won't change the state, but it can be useful for debugging and inspecting the state data.

Also `_` getter can be used not on the state itself, but on any nested objects and arrays. For example:

```ts
const state = await epos.state.connect()
state.data = { items: [{ id: 1 }, { id: 2 }] }
state.data._ // Works
state.data.items._ // Also works
state.data.items[0]._ // Works as well
```

## Initial State

When you connect to a state, you can also provide an initial value. This can be useful if you want to set some default values for your state. Just provide the initial value as an argument to `connect()`:

```ts
const state = await epos.state.connect({ count: 0, user: null })
```

This will set the initial state to an object with `count` and `user` properties. If the state already has some data, the initial value will be ignored and the existing data will be used instead.

## State + React

Epos state works perfectly with React. You can just use state object in your components. But to make sure your components re-render when the state changes, you need to wrap components with `epos.component()`:

```tsx
const state = await epos.state.connect({ count: 0 })

// Will automatically re-render when `state.count` changes
const MyComponent = epos.component(() => {
  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => state.count++}>Increment</button>
    </div>
  )
})
```

## Multiple States

Usually it is perfectly fine to have single state for your entire application. But in some cases, you need to split state to several parts. To do this, you can use named states. Just provide a name as the first argument to `connect()`:

```ts
const defaultState = await epos.state.connect({ count: 0 })
const settingsState = await epos.state.connect('settings', { theme: 'light' })
const userDataState = await epos.state.connect('userData', { name: '', email: '' })
```

## State Versioning

As your app evolves, you may need to add new properties to the state or change its structure. To handle this, Epos provides a versioning system that allows you to define migrations for your state. You can provide versioner as an argument to `connect()`. A versioner is an object with numeric keys (versions) which hold migration functions. In the migration function you can modify the state to fit the new structure. For example:

```ts
// First version
const state = await epos.state.connect({ count: 0 })

// Later, we decided to add `user` property.
const state = await epos.state.connect(
  // All new clients will get this initial state
  { count: 0, user: null },
  {
    // This migration will run for all clients with version less than 1
    1(s) {
      s.user = null
    },
  },
)
```

When a client connects to the state, Epos checks the current version of the state and runs all migrations that are needed to bring it up to date. This way you can ensure that all clients have the same state structure, even if they were created at different times.

## Transaction

If you need to make multiple changes to the state at once, you can do this, just do them as you usually do in JavaScript:

```ts
state.count += 1
state.user = { name: 'Alice' }
state.items.push('New item')
```

But doing this will trigger synchronization for each change. Actually this is perfectly fine in most cases, but to optimize performance, you can batch multiple changes into a single transaction:

```ts
epos.state.transaction(() => {
  state.count += 1
  state.user = { name: 'Alice' }
  state.items.push('New item')
})
```

Doing this, only one synchronization event will be triggered after the transaction is completed, which can improve performance if you have a lot of changes to make at once.

::: warning

If transaction fails, the state will still be updated with all changes made before the failure. So make sure to handle errors properly inside the transaction to avoid leaving the state in an inconsistent state.

:::

::: warning

Transactions can't be async, all changes inside the transaction must be made synchronously.

:::

## Local State

Sometimes you need to have some state that is not synchronized across contexts and is only used in a specific context. For this, you can use `epos.state.local` method. You can pass initial value to it as well, just like with `connect()`:

```ts
const localState = epos.state.local({ isOpen: false, selectedItem: null })
localState.isOpen = true // Will trigger component updates
```

## Other Methods

- `epos.state.disconnect` disconnects from the state, stopping synchronization but keeping the data intact.

```ts
const state = await epos.state.connect({ count: 0 })
state.count += 1 // synced and saved
await epos.state.disconnect()
state.count += 1 // Not synced, but `state.count` will be updated
```

- `epos.state.remove` removes the state. To remove named state, just provide name as the first argument.

```ts
await epos.state.remove() // Removes default state and all its data
await epos.state.remove('settings') // Removes `settings` state and all its data
```

- `epos.state.list` lists all existing states with their names and versions.

```ts
const states = await epos.state.list()
console.log(states)
```

Usually you do not need to use this method, but it can be useful for debugging and development.

## Models

Beside regular objects and arrays, state also supportes classes. These classes are called `models`, just to distinguish them. It can be useful if you want to add some methods or getters to your state objects. To use classes in state, you need to register them first with `epos.state.register` method:

```ts
// Define a model class
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

// Here we registered User model as `User`
epos.state.register({ User })
// If you want to register it with a different name, just change the key:
// epos.state.register({ MyUser: User })

const state = await epos.state.connect()
state.user = new User('Alice', 'Smith')
state.user.fullName() // Works as expected
```

How does this work? State persists in IndexedDB, and IndexedDB can not store class instances. It requires regular data. So how models are stored? Epos adds special '@' field to the state, so in our case, state.user has not 2 fields, but actually 3 fields:

```ts
state.user._
// { '@': 'User', firstName: 'Alice', lastName: 'Smith' }
```

And this object is saved to IndexedDB. When state is loaded, Epos checks if there is an '@' field, and if it matches any registered model, it creates an applies prototype of that model to the object. This way you can use classes in your state and they will be properly saved and loaded. Also, models are syncronized actoss contexts as well. And it is not necessary to register models in every context. For example, if you do not need any extra methods for users in your `background.ts`, you can omit registering `User` model there. The syncronization will continue to work, but in `background.ts` you will get regular objects without methods, and in contexts where `User` model is registered, you will get full instances of `User` class with all methods.

## MobX

Epos state is built on top of MobX, so you can use all MobX features with it. For example, you can watch changes via `reaction`:

```ts
// You DO NOT need to install 'mobx' package, it is included with `epos` package
import { reaction } from 'mobx'

const state = await epos.state.connect({ count: 0 })

reaction(
  // Watch `state.count`
  () => state.count,
  // React to changes
  count => console.log('Count changed:', count),
)
```

You can learn more about MobX and its features in the [MobX documentation](https://mobx.js.org/README.html). But usually `reaction` is enough for most use cases.

## Yjs

For real-time synchronization between different clients, Epos uses Yjs library under the hood. This is a CRDT library that automatically manages conflict resolution. Actually, it provides data types that are conflict-free, but you can think of it as a magical synchronization engine. Each change of the state generates a small binary "patch" which is sent to all extension contexts via `epos.bus` and then this patch is applied by every context.

Since Yjs is conflict-free, you will never come to a situation, where two contexts become out of sync. Or your changes are applied not as you expected.

You do not need to know about Yjs to work with Epos state, but if you want to learn more about how it works and what features it provides, you can check out the [Yjs documentation](https://docs.yjs.dev/).
