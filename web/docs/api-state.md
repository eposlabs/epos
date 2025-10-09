# State

Reactive, shared, and persisted state for your project. Connect a state once and use it like a plain object — changes propagate to all contexts (tabs, popup, background, etc.) and are automatically **persisted in IndexedDB** so they survive refreshes.

- [epos.state.connect](/docs/api-state#epos-state-connect)
- [epos.state.disconnect](/docs/api-state#epos-state-disconnect)
- [epos.state.transaction](/docs/api-state#epos-state-transaction)
- [epos.state.local](/docs/api-state#epos-state-local)
- [epos.state.destroy](/docs/api-state#epos-state-destroy)
- [epos.state.list](/docs/api-state#epos-state-list)
- 🎓 [epos.state.symbols](/docs/api-state#epos-state-symbols)
- 🎓 [epos.state.register](/docs/api-state#epos-state-register)

```js
// Connect (create or open) a named state
const state = await epos.state.connect('profile', { username: 'World' })

// Use like a normal object — updates sync across contexts and persist to IDB
state.username = 'Epos'
```

## `epos.state.connect`

Connects to a state. If it doesn’t exist, it’s created with the provided initial value.
Returns a **reactive** object you can mutate directly.

```ts
// Syntax
epos.state.connect(initial?: Initial, versioner?: Versioner) {}
epos.state.connect(name?, initial?: Initial, versioner?: Versioner)
```

// Types

```ts
type Initial<T extends Record<string, any>> = T | (() => T)
type Versioner = Record<number, () => void>
```

// Example
const state = await epos.state.connect({ count: 0 })
state.count // 0
state.count += 1 // reactive + sync + persist

````

**Example**

```js
const prefs = await epos.state.connect('prefs', { theme: 'dark', volume: 0.8 })
prefs.theme = 'light' // sync + persist
````

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

## `epos.state.local`

Creates a **local-only** reactive state (no sync, no persistence).

**Usage**

```ts
epos.state.local<T extends object = {}>(state?): T
```

**Example**

```js
const ui = epos.state.local({ modalOpen: false })
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

- `epos.state.registerModels(...)` — _placeholder (advanced feature, docs TBD)._
- `epos.state.symbols` — _placeholder (advanced feature, docs TBD)._

---

**Notes**

- State objects are reactive (MobX under the hood), so reading properties inside components will re-render them on change.
- Persistence uses IDB; schema changes should be handled via the `versioner`.
