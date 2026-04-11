# Storage

`epos.storage` is a simple persistent key-value storage powered by IndexedDB.

Use it for files and any data that does not need to be reactive.

## Basic Usage

`epos.storage` provides simple `get()`, `set()`, `has()`, `keys()`, and `delete()` methods:

```ts
await epos.storage.set('theme', 'dark')
await epos.storage.set('user', { name: 'James' })

const theme = await epos.storage.get<string>('theme') // 'dark'
const hasTheme = await epos.storage.has('theme') // true
const allKeys = await epos.storage.keys() // ['theme', 'user']

await epos.storage.delete('theme')
```

If a key does not exist, `get()` returns `null`.

## Named Storages

For larger projects, you may want separate storages for different kinds of data. In that case, pass the storage name as the first argument:

```ts
await epos.storage.set('users', 'u1', { name: 'James' })
await epos.storage.set('users', 'u2', { name: 'Mary' })
await epos.storage.set('settings', 'theme', 'dark')

const user = await epos.storage.get<User>('users', 'u1')
const userIds = await epos.storage.keys('users')
const hasUser = await epos.storage.has('users', 'u1')
await epos.storage.delete('users', 'u1')
```

## `epos.storage.for()`

If you use one named storage often, you can create a namespaced API for it with `for()`:

```ts
const users = epos.storage.for('users')

const user = await users.get<User>('u1')
const userIds = await users.keys()
```

Notice that `for()` is synchronous. You do not need to `await` it.

## Listing Storages

Use `list()` when you want to see all storages that exist in your app:

```ts
const storages = await epos.storage.list()

console.log(storages)
// [
//   { name: null },
//   { name: 'users' },
//   { name: 'settings' }
// ]
```

The default storage does not have a name, so it appears as `name: null`.

## Removing Data

Use `delete()` to remove a single key:

```ts
await epos.storage.delete('theme') // Remove key from the default storage
await epos.storage.delete('users', 'u1') // From 'users' storage
```

Use `clear()` to remove the whole storage and everything inside it:

```ts
await epos.storage.clear() // Clear default storage
await epos.storage.clear('users') // Clear 'users' storage
```

The data is removed permanently, so use `clear()` with caution.

If you `clear()` a storage, it will not appear in `list()` again until you add new data to it.

## Files and Binary Data

Unlike `chrome.storage`, `epos.storage` can store more than plain JSON data. It supports `Blob`, `File`, and other binary values:

```ts
const res = await fetch('https://picsum.photos/300/300')
const image = await res.blob()
await epos.storage.set('image', image)
```

This makes it useful for storing user files, cache data, and other large values.

Storage is **unlimited**. You can store gigabytes of data if the user has enough disk space.
