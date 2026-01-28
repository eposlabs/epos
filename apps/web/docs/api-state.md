---
outline: [2, 3]
---

# State API

The state API provides a powerful state management system with automatic synchronization across all extension contexts. It's built on top of MobX and Yjs, handling conflict resolution automatically.

## epos.state.connect()

Connect to a shared state. The state is automatically synchronized across all extension contexts (popup, background, content scripts, iframes).

```ts
epos.state.connect<T>(
  initial?: T,
  versioner?: Versioner<T>
): Promise<T>

epos.state.connect<T>(
  name: string,
  initial?: T,
  versioner?: Versioner<T>
): Promise<T>
```

### Parameters

- `name` - Optional state name. If not provided, uses the default state (`:default`)
- `initial` - Initial state value. Can be an object, array, or class instance
- `versioner` - Optional versioning function for state migrations

### Returns

A Promise that resolves to the connected state object. The state is observable and any changes are automatically synchronized.

### Example

```ts
// Simple state
const state = await epos.state.connect({
  count: 0,
  user: null,
})

// Named state
const settings = await epos.state.connect('settings', {
  theme: 'light',
  language: 'en',
})

// Class-based state
class TodoStore {
  todos = []

  addTodo(text: string) {
    this.todos.push({ text, done: false })
  }
}

const todoState = await epos.state.connect(new TodoStore())
```

## epos.state.disconnect()

Disconnect from a state. This stops synchronization but doesn't remove the state data.

```ts
epos.state.disconnect(name?: string): void
```

### Parameters

- `name` - Optional state name. If not provided, disconnects from the default state (`:default`)

### Example

```ts
// Disconnect from default state
epos.state.disconnect()

// Disconnect from named state
epos.state.disconnect('settings')
```

## epos.state.transaction()

Batch multiple state changes into a single transaction for better performance.

```ts
epos.state.transaction(fn: () => void): void
```

### Parameters

- `fn` - Function that performs multiple state changes

### Example

```ts
const state = await epos.state.connect({
  count: 0,
  total: 0,
  history: [],
})

// Without transaction (triggers 3 syncs)
state.count = 5
state.total += 5
state.history.push(5)

// With transaction (triggers 1 sync)
epos.state.transaction(() => {
  state.count = 10
  state.total += 10
  state.history.push(10)
})
```

## epos.state.create()

Create a local state without synchronization. Useful for component-level state.

```ts
epos.state.create<T>(initial?: T): T
```

### Parameters

- `initial` - Initial state value

### Returns

An observable local state object (not synchronized)

### Example

```ts
// Local component state
const localState = epos.state.create({
  isOpen: false,
  selectedItem: null
})

// Use in component
const MyComponent = epos.component(() => {
  const local = epos.state.create({ count: 0 })

  return (
    <button onClick={() => local.count++}>
      Count: {local.count}
    </button>
  )
})
```

## epos.state.list()

Get a list of all available states with their connection status.

```ts
epos.state.list(
  filter?: { connected?: boolean }
): Promise<{ name: string | null; connected: boolean }[]>
```

### Parameters

- `filter` - Optional filter object
  - `connected` - If `true`, only returns connected states. If `false`, only returns disconnected states

### Returns

A Promise that resolves to an array of state info objects.

### Example

```ts
// Get all states
const allStates = await epos.state.list()
console.log(allStates)
// [
//   { name: null, connected: true },       // default state
//   { name: 'settings', connected: true },
//   { name: 'cache', connected: false }
// ]

// Get only connected states
const connected = await epos.state.list({ connected: true })

// Get only disconnected states
const disconnected = await epos.state.list({ connected: false })
```

## epos.state.remove()

Permanently delete a state and all its data from storage.

```ts
epos.state.remove(name?: string): Promise<void>
```

### Parameters

- `name` - Optional state name. If not provided, removes the default state (`:default`)

### Example

```ts
// Remove default state
await epos.state.remove()

// Remove named state
await epos.state.remove('old-cache')
```

::: warning
This action is permanent and cannot be undone. All state data will be lost.
:::

## epos.state.register()

Register model classes that can be used in states. This is necessary if you want to use custom classes in your state.

```ts
epos.state.register(models: Record<string, Constructor>): void
```

### Parameters

- `models` - Object mapping model names to constructor functions

### Example

```ts
class Todo {
  text = ''
  done = false

  constructor(text: string) {
    this.text = text
  }

  toggle() {
    this.done = !this.done
  }
}

class User {
  name = ''
  email = ''
}

// Register models (must be done before connecting to state)
epos.state.register({
  Todo,
  User,
})

// Now you can use these classes in state
const state = await epos.state.connect({
  todos: [new Todo('Buy milk')],
  currentUser: new User(),
})
```

## State Symbols

### epos.state.PARENT

Access the parent object in a nested state structure.

```ts
epos.state.PARENT: symbol
```

### Example

```ts
const state = await epos.state.connect({
  items: [{ name: 'Item 1', parent: null }],
})

const item = state.items[0]
const parent = item[epos.state.PARENT] // Access parent array
```

### epos.state.ATTACH

Symbol for attach lifecycle hook. Called when an object is added to state.

```ts
epos.state.ATTACH: symbol
```

### Example

```ts
class Todo {
  text = ''

  [epos.state.ATTACH]() {
    console.log('Todo attached to state')
  }
}
```

### epos.state.DETACH

Symbol for detach lifecycle hook. Called when an object is removed from state.

```ts
epos.state.DETACH: symbol
```

### Example

```ts
class Todo {
  text = ''
  cleanup = null

  [epos.state.ATTACH]() {
    this.cleanup = setInterval(() => {
      console.log('Still here')
    }, 1000)
  }

  [epos.state.DETACH]() {
    if (this.cleanup) {
      clearInterval(this.cleanup)
    }
  }
}
```

## State Versioning

Use the versioner parameter to handle state migrations when your state structure changes.

```ts
interface StateV1 {
  name: string
}

interface StateV2 {
  firstName: string
  lastName: string
  ':version': number
}

const state = await epos.state.connect<StateV2>(
  'user',
  { firstName: '', lastName: '', ':version': 2 },
  {
    // Migrate from v1 to v2
    2(state) {
      if ('name' in state) {
        const [firstName, lastName] = state.name.split(' ')
        delete state.name
        state.firstName = firstName || ''
        state.lastName = lastName || ''
        state[':version'] = 2
      }
    },
  },
)
```

## Usage Patterns

### Simple Counter

```ts
// Background or any context
const counter = await epos.state.connect({ count: 0 })

// In component
const Counter = epos.component(() => {
  const state = await epos.state.connect({ count: 0 })

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => state.count++}>+</button>
    </div>
  )
})
```

### Todo List

```ts
class Todo {
  text: string
  done: boolean = false

  constructor(text: string) {
    this.text = text
  }

  toggle() {
    this.done = !this.done
  }
}

class TodoStore {
  todos: Todo[] = []

  addTodo(text: string) {
    this.todos.push(new Todo(text))
  }

  removeTodo(todo: Todo) {
    const index = this.todos.indexOf(todo)
    if (index !== -1) {
      this.todos.splice(index, 1)
    }
  }
}

// Register model
epos.state.register({ Todo, TodoStore })

// Connect
const store = await epos.state.connect(new TodoStore())

// Use
store.addTodo('Buy milk')
store.todos[0].toggle()
```

### Settings with Named State

```ts
// In background
const settings = await epos.state.connect('settings', {
  theme: 'light',
  notifications: true,
  language: 'en',
})

// In popup - automatically synchronized!
const settings = await epos.state.connect('settings', {
  theme: 'light',
  notifications: true,
  language: 'en',
})

settings.theme = 'dark' // Changes reflected everywhere instantly
```

::: tip
State changes are automatically batched and synchronized efficiently. You don't need to worry about performance when making multiple changes.
:::

::: warning
State names starting with `:` are reserved for internal use (except `:default`).
:::
