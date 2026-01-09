# State API

Reactive, shared, and persisted state for your project. Connect a state once and use it like a plain object — changes propagate to all contexts (tabs, popup, background, etc.) and are automatically **persisted in IndexedDB** so they survive refreshes.

## `epos.state.connect`

Connects to a state. If it doesn’t exist, it’s created with the provided initial value.
Returns a **reactive** object you can mutate directly.

**Syntax:**

```ts
// Connect to the default state
epos.state.connect(initial?: Initial, versioner?: Versioner)

// Connect to a specific named state
epos.state.connect(name?, initial?: Initial, versioner?: Versioner)
```

**Types:**

```ts
type Initial<T extends Record<string, any>> = T | (() => T)
type Versioner = Record<number, () => void>
```

**Examples:**

```ts
// Connect to the default state
const state = await epos.state.connect({ count: 0 })
console.log(state.count) // 0 initially, then +1 on each reload
state.count += 1 // Reactive update, synced across contexts and saved to IDB

// Using lazy initial state
const state = await epos.state.connect(() => ({ count: 0 }))

// Connect to a named state
const chat = await epos.state.connect('chat', { messages: [] })

// Using versioning (migrations)
const state = await epos.state.connect(
  { count: 0 },
  {
    // Migration from version 0 (no version) to version 1
    1() {
      this.count = 1
    },
    // Migration from version 1 to version 2
    2() {
      delete this.count
      this.newProp = true
    },
  },
)
```

::: details Versioning & migrations
Use a **versioner** to evolve state shape safely over time.
Keys are **incremental integers** (`1`, `2`, `3`, …). Epos stores the current version in `:version`.

- On **first initialization**, no migrations run — the **latest** shape is used and `:version` is set accordingly.
- When connecting to **existing** state, migrations from the stored `:version` up to the latest are applied.

**Example**

```ts
type S = { initial: number; newValue?: number }

const s = await epos.state.connect<S>(
  'counter',
  { initial: 1, newValue: 2 },
  {
    1() {
      // `this` is the mutable state snapshot
      this.newValue = 2
    },
    2() {
      // future migrations...
    },
  },
)
```

- If stored state is `{ initial: 1 }` with no `:version`, migration `1` runs and adds `newValue`.
- If state is created now for the first time, migrations are **not** applied and `newValue` already exists.
  :::

## `epos.state.disconnect`

Disconnects from a state (stops syncing/reactivity in this context). Data remains persisted.

**Usage**

```ts
epos.state.disconnect(name?)
```

**Example**

```js
epos.state.disconnect('prefs')
```

## `epos.state.transaction`

Batches multiple mutations into a single reactive update.

**Usage**

```ts
epos.state.transaction(fn)
```

**Example**

```js
epos.state.transaction(() => {
  prefs.theme = 'dark'
  prefs.volume = 1
})
```

## `epos.state.create`

Creates a **local-only** reactive state (no sync, no persistence).

**Usage**

```ts
epos.state.create<T extends object = {}>(state?): T
```

**Example**

```js
const ui = epos.state.create({ modalOpen: false })
ui.modalOpen = true // local to this context
```

## `epos.state.list`

Lists known states. Pass `{ connected: true }` to see only states currently connected in this context.

**Usage**

```ts
epos.state.list(filter?: { connected?: boolean }): Promise<{ name: string | null }[]>
```

**Example**

```js
const names = await epos.state.list()
console.table(names)
```

## `epos.state.destroy`

Removes a state and **all** its persisted data.

**Usage**

```ts
epos.state.destroy(name?): Promise<void>
```

**Example**

```js
await epos.state.destroy('prefs')
```

## Advanced

- `epos.state.register(...)` — _placeholder (advanced feature, docs TBD)._

---

**Notes**

- State objects are reactive (MobX under the hood), so reading properties inside components will re-render them on change.
- Persistence uses IDB; schema changes should be handled via the `versioner`.
