# Storage

`epos.storage` is a simple persistent key-value storage powered by IndexedDB.

Use it for storing files and any data which does not need to be reactive. A good rule is this:

- Use `epos.state` for live shared app data.
- Use `epos.storage` for heavy data and files.

This guide focuses on the common patterns. For raw method signatures, see the [Storage API Reference](/api/storage).

## Basic Usage

`epos.storage` provides simple key-value APIs:

```ts
await epos.storage.set('theme', 'dark')
await epos.storage.set('user', { name: 'Sam' })

const theme = await epos.storage.get<string>('theme') // 'dark'
const hasTheme = await epos.storage.has('theme') // true
const allKeys = await epos.storage.keys() // ['theme', 'user']

await epos.storage.delete('theme')
```

If a key does not exist, `get()` returns `null`.

## Named Storages

For larger projects, you may need different storages for different purposes. Just provide storage name as the first argument:

```ts
await epos.storage.set('users', 'user-1', { name: 'James' })
await epos.storage.set('users', 'user-2', { name: 'Mary' })
await epos.storage.set('settings', 'theme', 'dark')

const user = await epos.storage.get<User>('users', 'user-1')
const userIds = await epos.storage.keys('users')
const hasUser = await epos.storage.has('users', 'user-1')
await epos.storage.delete('users', 'user-1')
```

## `epos.storage.for()`

If you use some named storage often, you can create namespaced API for it using `for()`:

```ts
const users = epos.storage.for('users')

const user = await users.get<User>('user-1')
const userIds = await users.keys()
```

## Listing Storages

Use `list()` when you want to inspect what storages you have:

```ts
const storages = await epos.storage.list()

console.log(storages)
// [
//   { name: null, keys: ['theme', 'user'] },
//   { name: 'users', keys: ['user-1', 'user-2'] },
//   { name: 'settings', keys: ['theme'] }
// ]
```

The default storage does not have a name, so it appears as `name: null`.

## Removing Data

Use `delete()` to delete single key:

```ts
await epos.storage.delete('theme')
await epos.storage.delete('users', 'user-1')
```

Use `remove()` to remove the whole storage and everything inside it:

```ts
await epos.storage.remove()
await epos.storage.remove('users')
```

::: warning

`remove()` removes data permanently. Use with caution.

:::

## Files and Binary Data

Unlike `chrome.storage`, `epos.storage` can store more than plain JSON data. It supports Blobs, Files and other binary formats:

```ts
const res = await fetch('https://picsum.photos/300/300')
const image = await res.blob()
await epos.storage.set('image', image)
```

This makes storage useful for storing user files, cache data, and other large values.

Storage is **unlimited**. You can store gigabytes of data if the user has enough disk space.
