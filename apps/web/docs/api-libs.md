---
outline: [2, 3]
---

# Libraries API

The libs API provides access to the third-party libraries that Epos uses internally. This allows you to use the same library versions without bundling them yourself.

## Available Libraries

All libraries are accessible through the `epos.libs` object:

```ts
epos.libs: {
  mobx: typeof mobx
  mobxReactLite: typeof mobxReactLite
  react: typeof react
  reactDom: typeof reactDom
  reactDomClient: typeof reactDomClient
  reactJsxRuntime: typeof reactJsxRuntime
  yjs: typeof yjs
}
```

## epos.libs.react

Access to the React library.

```ts
epos.libs.react: typeof React
```

### Example

```ts
const { useState, useEffect, useMemo } = epos.libs.react

const MyComponent = () => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log('Count changed:', count)
  }, [count])

  const doubled = useMemo(() => count * 2, [count])

  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubled}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  )
}
```

## epos.libs.reactDom

Access to the ReactDOM library.

```ts
epos.libs.reactDom: typeof ReactDOM
```

### Example

```ts
const { createPortal } = epos.libs.reactDom

const Modal = ({ children }) => {
  return createPortal(
    <div className="modal">{children}</div>,
    document.body
  )
}
```

## epos.libs.reactDomClient

Access to the ReactDOM client library for rendering.

```ts
epos.libs.reactDomClient: typeof ReactDOMClient
```

### Example

```ts
const { createRoot } = epos.libs.reactDomClient

// Manual rendering (usually epos.render() does this)
const container = document.getElementById('root')
const root = createRoot(container)
root.render(<App />)
```

## epos.libs.reactJsxRuntime

Access to the React JSX runtime.

```ts
epos.libs.reactJsxRuntime: typeof ReactJsxRuntime
```

### Example

```ts
const { jsx, jsxs, Fragment } = epos.libs.reactJsxRuntime

// Manual JSX creation
const element = jsx('div', {
  className: 'container',
  children: 'Hello World',
})
```

## epos.libs.mobx

Access to the MobX library for state management.

```ts
epos.libs.mobx: typeof MobX
```

### Example

```ts
const { makeObservable, observable, action, computed } = epos.libs.mobx

class TodoStore {
  todos = []

  constructor() {
    makeObservable(this, {
      todos: observable,
      addTodo: action,
      completedCount: computed,
    })
  }

  addTodo(text) {
    this.todos.push({ text, done: false })
  }

  get completedCount() {
    return this.todos.filter(todo => todo.done).length
  }
}

const store = new TodoStore()
```

## epos.libs.mobxReactLite

Access to the MobX React integration library.

```ts
epos.libs.mobxReactLite: typeof MobXReactLite
```

### Example

```ts
const { observer } = epos.libs.mobxReactLite

// Manually create observer (epos.component() does this)
const Counter = observer(() => {
  const state = epos.state.create({ count: 0 })

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => state.count++}>+</button>
    </div>
  )
})
```

## epos.libs.yjs

Access to the Yjs library for CRDT-based data synchronization.

```ts
epos.libs.yjs: typeof Yjs
```

### Example

```ts
const { Doc, Map, Array } = epos.libs.yjs

// Create a Yjs document
const doc = new Doc()
const ymap = doc.getMap('data')

ymap.set('name', 'John')
ymap.set('age', 30)

// Listen for changes
ymap.observe(event => {
  console.log('Map changed:', event)
})

// Create shared array
const yarray = doc.getArray('items')
yarray.push(['item1', 'item2'])
```

## Why Use Built-in Libraries?

### 1. Smaller Bundle Size

Using `epos.libs` instead of importing libraries directly means you don't need to bundle them, resulting in smaller extension sizes.

```ts
// ❌ Increases bundle size
import React from 'react'
import { observable } from 'mobx'

// ✅ Uses built-in libraries (no bundling needed)
const React = epos.libs.react
const { observable } = epos.libs.mobx
```

### 2. Version Consistency

Using the same library versions as Epos ensures compatibility and prevents conflicts.

### 3. Instant Availability

Libraries are immediately available without installation or build steps.

## Usage Patterns

### React Hooks

```ts
const { useState, useEffect, useCallback, useMemo, useRef } = epos.libs.react

const MyComponent = epos.component(() => {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  const increment = useCallback(() => {
    setCount(c => c + 1)
  }, [])

  const doubled = useMemo(() => count * 2, [count])

  useEffect(() => {
    console.log('Component mounted')
    return () => console.log('Component unmounted')
  }, [])

  return (
    <div>
      <p>Count: {count} (Doubled: {doubled})</p>
      <button onClick={increment}>+</button>
      <input
        ref={inputRef}
        value={text}
        onChange={e => setText(e.target.value)}
      />
    </div>
  )
})
```

### MobX Observable Class

```ts
const { makeObservable, observable, action, computed, reaction } = epos.libs.mobx

class Store {
  count = 0
  items = []

  constructor() {
    makeObservable(this, {
      count: observable,
      items: observable,
      increment: action,
      addItem: action,
      total: computed,
      isEmpty: computed,
    })

    // React to changes
    reaction(
      () => this.count,
      count => console.log('Count changed to:', count),
    )
  }

  increment() {
    this.count++
  }

  addItem(item) {
    this.items.push(item)
  }

  get total() {
    return this.items.reduce((sum, item) => sum + item.price, 0)
  }

  get isEmpty() {
    return this.items.length === 0
  }
}
```

### Yjs Document Sync

```ts
const { Doc, Map, Array, applyUpdate, encodeStateAsUpdate } = epos.libs.yjs

// Create document
const doc = new Doc()
const data = doc.getMap('shared-data')

// Sync with other peers
doc.on('update', update => {
  // Send update to other peers
  epos.bus.send('yjs:update', Array.from(update))
})

// Receive updates from other peers
epos.bus.on('yjs:update', (update: number[]) => {
  applyUpdate(doc, new Uint8Array(update))
})

// Modify shared data
data.set('user', { name: 'John', status: 'online' })
```

### React Portal

```ts
const { createPortal } = epos.libs.reactDom

const Modal = epos.component(({ isOpen, onClose, children }) => {
  if (!isOpen) return null

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>,
    document.body
  )
})
```

### Advanced MobX Patterns

```ts
const { makeObservable, observable, action, computed, reaction, autorun, when, runInAction } = epos.libs.mobx

class AsyncStore {
  data = null
  loading = false
  error = null

  constructor() {
    makeObservable(this, {
      data: observable,
      loading: observable,
      error: observable,
      fetchData: action,
      hasData: computed,
    })

    // Auto-run on changes
    autorun(() => {
      if (this.hasData) {
        console.log('Data available:', this.data)
      }
    })

    // Wait for condition
    when(
      () => this.hasData,
      () => console.log('Data loaded!'),
    )
  }

  async fetchData() {
    this.loading = true
    this.error = null

    try {
      const response = await fetch('https://api.example.com/data')
      const data = await response.json()

      runInAction(() => {
        this.data = data
        this.loading = false
      })
    } catch (error) {
      runInAction(() => {
        this.error = error.message
        this.loading = false
      })
    }
  }

  get hasData() {
    return this.data !== null
  }
}
```

## TypeScript Support

All libraries have full TypeScript support:

```ts
import type { FC, ReactNode } from 'react'
import type { IObservableArray } from 'mobx'
import type { Doc, Map as YMap } from 'yjs'

const MyComponent: FC<{ children: ReactNode }> = ({ children }) => {
  return <div>{children}</div>
}

const observable: IObservableArray<string> = epos.libs.mobx.observable.array([])

const doc: Doc = new epos.libs.yjs.Doc()
const ymap: YMap<any> = doc.getMap('data')
```

::: tip
Using `epos.libs` instead of installing packages separately keeps your extension lightweight and ensures compatibility with Epos's internal systems.
:::

::: info
The libraries are already loaded and available globally. You don't need to import or install them.
:::
