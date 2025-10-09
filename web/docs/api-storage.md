# Storage

The **Storage API** provides persistent key–value storage, similar to `localStorage`, but asynchronous, namespaced, and backed by **IndexedDB**.  
You can use it to save user preferences, cached data, or any small structured objects.

## `epos.storage.get`

Retrieves a value from storage.

**Usage**

```ts
epos.storage.get<T = unknown>(key: string, storageName?: string): Promise<T>
```

**Example**

```js
const theme = await epos.storage.get('theme')
console.log(theme)
```

## `epos.storage.set`

Saves a value in storage.

**Usage**

```ts
epos.storage.set<T = unknown>(key: string, value: T, storageName?: string): Promise<void>
```

**Example**

```js
await epos.storage.set('theme', 'dark')
```

## `epos.storage.delete`

Removes a value by key.

**Usage**

```ts
epos.storage.delete(key: string, storageName?: string): Promise<void>
```

**Example**

```js
await epos.storage.delete('theme')
```

## `epos.storage.keys`

Returns all keys in the given storage (or in the default one).

**Usage**

```ts
epos.storage.keys(storageName?: string): Promise<string[]>
```

**Example**

```js
const keys = await epos.storage.keys()
console.log(keys)
```

## `epos.storage.clear`

Clears all data from the specified storage and removes the storage itself.

**Usage**

```ts
epos.storage.clear(storageName?: string): Promise<void>
```

**Example**

```js
await epos.storage.clear()
```

## `epos.storage.use`

Returns a scoped Storage API instance for a specific storage name.
Useful for organizing related data under separate namespaces.

**Usage**

```ts
epos.storage.use(storageName: string): Promise<Storage>
```

**Example**

```js
const userStorage = await epos.storage.use('user')
await userStorage.set('token', 'abc123')
const token = await userStorage.get('token')
```

## `epos.storage.list`

Lists all existing storages.

**Usage**

```ts
epos.storage.list(): Promise<{ name: string | null }[]>
```

**Example**

```js
const storages = await epos.storage.list()
console.table(storages)
```

---

Each storage is persisted in IndexedDB and isolated by name.
Unlike `state`, storage is **non-reactive** — it’s meant for static or rarely changing data.
