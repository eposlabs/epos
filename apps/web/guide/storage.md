# Storage

Epos provides a built-in storage API for files, cached data, settings, and other values that should survive browser restarts. Under the hood it uses IndexedDB, but the API is much simpler: you read and write values by key.

Like other Epos APIs, `epos.storage` works in any context. You can save data in the popup, then read it later from the background, a content script, or an iframe.

This guide focuses on practical usage. For the raw API signatures, see the [API Reference](/api/storage).

## When to Use Storage

Use `epos.storage` when you need persistence, but not a reactive shared object. If your data should behave like live app state and update your UI automatically, use `epos.state` instead.

## Basic Usage

The most common APIs are `get()`, `set()`, `has()` and `delete()`. If the key does not exist, `get()` returns `null`.

```ts
// Save a value to storage
await epos.storage.set('theme', 'dark')

// Read value from storage
const theme = await epos.storage.get<string>('theme')

// Delete value from storage
await epos.storage.delete('theme')

// Check if key exists
const exists = await epos.storage.has('theme') // false
```

## Files and large values

Unlike `chrome.storage`, `epos.storage` is not limited to plain JSON values. You can also store files and other binary data.

```ts
const input = document.querySelector('input[type=file]') as HTMLInputElement
const file = input.files?.[0]

if (file) {
  await epos.storage.set('avatar', file)
}

const avatar = await epos.storage.get<File>('avatar')
```

This makes storage useful for imported assets, offline caches, and any data that would be awkward to keep in `chrome.storage`.

## Named storages

When your project grows, keeping everything in one flat key space becomes messy. Epos lets you split data into named storages.

```ts
await epos.storage.set('auth', 'token', 'abc123')
await epos.storage.set('auth', 'refreshToken', 'def456')
await epos.storage.set('cache', 'user:42', { name: 'Alex' })

const token = await epos.storage.get<string>('auth', 'token')
const user = await epos.storage.get<{ name: string }>('cache', 'user:42')
```

This is usually better than inventing prefixes such as `auth:token` or `cache:user:42` inside one default storage.

## `epos.storage.for()`

If you work with one named storage often, create a bound helper with `for()`.

```ts
const authStorage = epos.storage.for('auth')

await authStorage.set('token', 'abc123')
await authStorage.set('refreshToken', 'def456')

const token = await authStorage.get<string>('token')
const keys = await authStorage.keys()
```

This does not create a new kind of storage. It is just a shorter API bound to one storage name.

If you call `epos.storage.for()` without a name, it points to the default storage.

## Inspecting stored data

Use `keys()` when you want all keys from one storage.

```ts
const keys = await epos.storage.keys()
const cacheKeys = await epos.storage.keys('cache')
```

Use `list()` when you want to inspect the whole storage layout.

```ts
const storages = await epos.storage.list()

console.log(storages)
// [
//   { name: null, keys: ['theme', 'language'] },
//   { name: 'auth', keys: ['token'] },
//   { name: 'cache', keys: ['user:42'] }
// ]
```

The default storage is returned as `name: null`.

## Removing data

Use `delete()` to remove one key.

```ts
await epos.storage.delete('theme')
await epos.storage.delete('auth', 'token')
```

Use `remove()` to delete the whole storage and all keys inside it.

```ts
await epos.storage.remove()
await epos.storage.remove('cache')
```

::: warning
`remove()` deletes the whole storage permanently. Use it only when you really want to wipe everything inside that storage.
:::

## Available methods

`epos.storage` exposes these methods:

```ts
epos.storage.get<T>(key: string): Promise<T | null>
epos.storage.get<T>(name: string, key: string): Promise<T | null>

epos.storage.set<T>(key: string, value: T): Promise<void>
epos.storage.set<T>(name: string, key: string, value: T): Promise<void>

epos.storage.delete(key: string): Promise<void>
epos.storage.delete(name: string, key: string): Promise<void>

epos.storage.keys(name?: string): Promise<string[]>
epos.storage.list(): Promise<{ name: string | null; keys: string[] }[]>
epos.storage.remove(name?: string): Promise<void>

epos.storage.for(name?: string)
```

In short:

- `get()` reads one value
- `set()` writes one value
- `delete()` removes one key
- `keys()` lists keys from one storage
- `list()` lists all storages with their keys
- `remove()` deletes one whole storage
- `for()` creates a helper bound to one storage name

## A practical pattern

One simple pattern is to separate stable settings from disposable cache data.

```ts
const settings = epos.storage.for('settings')
const cache = epos.storage.for('cache')

await settings.set('theme', 'dark')
await settings.set('language', 'en')

await cache.set('users:42', {
  data: { id: 42, name: 'Alex' },
  savedAt: Date.now(),
})
```

This keeps cleanup simple. You can wipe the cache without touching settings.

```ts
await cache.remove()
```

## Storage vs state

`epos.storage` and `epos.state` are both persistent, but they solve different problems.

| API            | Best for                       | Sync         | Reactivity |
| -------------- | ------------------------------ | ------------ | ---------- |
| `epos.storage` | files, cache, settings, tokens | manual reads | none       |
| `epos.state`   | live shared app data           | automatic    | built in   |

If you save something with `epos.storage.set()`, other contexts can read it, but they will not react to that change automatically. If you need live shared data, prefer `epos.state`.

## Notes

- Storage names starting with `:` are reserved for internal use.
- The unnamed default storage is valid and often enough for small projects.
- For larger projects, named storages usually keep things easier to reason about.
