# epos.state.\*

`epos.state` is the shared state system used by Epos.

It combines observable objects with sync and persistence across contexts.

## epos.state.connect()

```ts
epos.state.connect<T>(initial?: Initial<T>, versioner?: Versioner<T>): Promise<T>
epos.state.connect<T>(name: string, initial?: Initial<T>, versioner?: Versioner<T>): Promise<T>
```

Connects to a shared state.

### Notes

- If `name` is omitted, Epos uses the default state.
- Custom state names cannot start with `:`.
- The initial value must be an object.
- Shared state supports objects, arrays, strings, numbers, booleans, and `null` values.
- Connected state is synchronized across contexts and persisted to IndexedDB.
- `versioner` is a map of version numbers to migration functions.

### Example

```ts
const state = await epos.state.connect({
  count: 0,
  items: [],
})

state.count += 1
```

## epos.state.disconnect()

```ts
epos.state.disconnect(name?: string): void
```

Disconnects from a shared state without deleting its stored data.

## epos.state.transaction()

```ts
epos.state.transaction(fn: () => void): void
```

Runs state changes in a batch.

### Notes

- This groups updates across all currently connected states.
- Use it when one action changes several observable values.

## epos.state.reaction

```ts
epos.state.reaction: typeof mobx.reaction
```

Direct access to MobX `reaction`.

## epos.state.local()

```ts
epos.state.local<T extends {}>(initial?: Initial<T>): T
```

Creates local observable state with no sync and no persistence.

### Notes

- Use this for component-local or context-local state.
- For local state, non-model class instances are made observable automatically.

## epos.state.list()

```ts
epos.state.list(filter?: { connected?: boolean }): Promise<{ name: string | null; connected: boolean }[]>
```

Lists known states for the current project.

### Notes

- The default state is reported as `name: null`.
- `connected` tells you whether the current context is connected to that state right now.

## epos.state.remove()

```ts
epos.state.remove(name?: string): Promise<void>
```

Removes a shared state and its persisted data.

### Notes

- This is permanent.

## epos.state.register()

```ts
epos.state.register(models: Record<string, Ctor>): void
```

Registers model classes that may appear inside shared state.

### Notes

- Register models before calling `connect()`.
- Registered names are used to restore prototypes when state is loaded again.
- If a model is missing and the project does not allow missing models, `connect()` can throw.

### Example

```ts
class Todo {
  text = ''

  toggle() {}
}

epos.state.register({ Todo })

const state = await epos.state.connect({
  todos: [new Todo()],
})
```

## epos.state.PARENT

```ts
epos.state.PARENT: symbol
```

A symbol for reading the parent object or parent array of an attached state node.

### Example

```ts
const parent = state.items[0][epos.state.PARENT]
```

## epos.state.ATTACH

```ts
epos.state.ATTACH: symbol
```

A lifecycle symbol called when a model object is attached to a state tree.

### Notes

- If the state is already connected, the handler runs immediately.
- Otherwise it runs after connection finishes.

## epos.state.DETACH

```ts
epos.state.DETACH: symbol
```

A lifecycle symbol called when a model object is detached from a state tree.

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
