# Storage API

The **Storage API** provides persistent key–value storage that keeps data in **IndexedDB**. You can use it to save any data or files.

There is no need to know how IndexedDB works under the hood, as the API abstracts away its complexity and provides a simple interface. Supports storing complex data types, including nested objects and binary data (blobs).

## `epos.storage.set`

Saves a value in storage. If `storageName` argument is not provided, default storage will be used. You may use as many storages as you need, but in most cases using only the default storage is sufficient.

**Syntax:**

```ts
epos.storage.set<T = unknown>(key: string, value: T, storageName?: string): Promise<void>
```

**Examples:**

```ts
// Save value to the default storage
await epos.storage.set('theme', 'dark')

// Save value to 'preferences' storage
await epos.storage.set('config', { theme: 'dark' }, 'preferences')
```

## `epos.storage.get`

Retrieves a value from storage. If `storageName` is not provided, default storage will be used.

**Syntax:**

```ts
epos.storage.get<T = unknown>(key: string, storageName?: string): Promise<T>
```

**Examples:**

```ts
// Get value from the default storage
const theme = await epos.storage.get('theme')

// Get value from 'preferences' storage
const config = await epos.storage.get('config', 'preferences')
```

## `epos.storage.delete`

TBD.

**Syntax:**

```ts
epos.storage.delete(key: string, storageName?: string): Promise<void>
```

**Examples:**

```ts
// Delete value from the default storage
await epos.storage.delete('theme')

// Delete value from 'preferences' storage
await epos.storage.delete('config', 'preferences')
```

## `epos.storage.keys`

TBD.

**Syntax:**

```ts
epos.storage.keys(storageName?: string): Promise<string[]>
```

**Examples:**

```ts
// Get all keys of the default storage
const keys = await epos.storage.keys()
console.log(keys)

// Get all keys of 'preferences' storage
const prefKeys = await epos.storage.keys('preferences')
console.log(prefKeys)
```

## `epos.storage.clear`

Clears all data from the specified storage and removes the storage itself.

**Syntax:**

```ts
epos.storage.clear(storageName?: string): Promise<void>
```

**Examples:**

```ts
await epos.storage.clear()
```

## `epos.storage.use`

Returns a scoped Storage API instance for a specific storage name.
Useful for organizing related data under separate namespaces.

**Syntax:**

```ts
epos.storage.use(storageName: string): Promise<Storage>
```

**Examples:**

```ts
const userStorage = await epos.storage.use('user')
await userStorage.set('token', 'abc123')
const token = await userStorage.get('token')
```

## `epos.storage.list`

Lists all existing storages. Returns a list of objects of with `name` field. The default storage does not have a name, so `{ name: null }` will be returned.

**Syntax:**

```ts
epos.storage.list(): Promise<{ name: string | null }[]>
```

**Examples:**

```ts
const storages = await epos.storage.list()
console.table(storages)
```
