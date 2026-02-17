---
outline: [2, 3]
---

# Storage API

The storage API provides a simple key-value storage system backed by IndexedDB. Unlike state, storage is not automatically synchronized but provides persistence across browser sessions.

## epos.storage.get()

Get a value from storage.

```ts
epos.storage.get<T>(key: string): Promise<T | null>
epos.storage.get<T>(name: string, key: string): Promise<T | null>
```

### Parameters

- `name` - Optional storage name. If not provided, uses default storage
- `key` - The key to retrieve

### Returns

A Promise that resolves to the stored value, or `null` if the key doesn't exist.

### Example

```ts
// Get from default storage
const theme = await epos.storage.get<string>('theme')
console.log(theme) // 'dark' or null

// Get from named storage
const token = await epos.storage.get<string>('auth', 'token')
```

## epos.storage.set()

Store a value in storage.

```ts
epos.storage.set<T>(key: string, value: T): Promise<void>
epos.storage.set<T>(name: string, key: string, value: T): Promise<void>
```

### Parameters

- `name` - Optional storage name. If not provided, uses default storage
- `key` - The key to store under
- `value` - The value to store (must be serializable)

### Example

```ts
// Set in default storage
await epos.storage.set('theme', 'dark')
await epos.storage.set('user', { id: 123, name: 'John' })

// Set in named storage
await epos.storage.set('auth', 'token', 'abc123...')
await epos.storage.set('cache', 'user:123', userData)
```

## epos.storage.delete()

Delete a key from storage.

```ts
epos.storage.delete(key: string): Promise<void>
epos.storage.delete(name: string, key: string): Promise<void>
```

### Parameters

- `name` - Optional storage name. If not provided, uses default storage
- `key` - The key to delete

### Example

```ts
// Delete from default storage
await epos.storage.delete('theme')

// Delete from named storage
await epos.storage.delete('auth', 'token')
```

## epos.storage.keys()

Get all keys in a storage.

```ts
epos.storage.keys(name?: string): Promise<string[]>
```

### Parameters

- `name` - Optional storage name. If not provided, uses default storage

### Returns

A Promise that resolves to an array of all keys in the storage.

### Example

```ts
// Get all keys from default storage
const keys = await epos.storage.keys()
console.log(keys) // ['theme', 'language', 'lastVisit']

// Get keys from named storage
const cacheKeys = await epos.storage.keys('cache')
console.log(cacheKeys) // ['user:123', 'user:456']
```

## epos.storage.list()

Get a list of all storages with their keys.

```ts
epos.storage.list(): Promise<{
  name: string | null
  keys: string[]
}[]>
```

### Returns

A Promise that resolves to an array of storage info objects. The default storage has `name: null`.

### Example

```ts
const storages = await epos.storage.list()
console.log(storages)
// [
//   { name: null, keys: ['theme', 'language'] },      // default storage
//   { name: 'auth', keys: ['token', 'refreshToken'] },
//   { name: 'cache', keys: ['user:123', 'post:456'] }
// ]
```

## epos.storage.remove()

Remove an entire storage and all its data.

```ts
epos.storage.remove(name?: string): Promise<void>
```

### Parameters

- `name` - Optional storage name. If not provided, removes default storage

### Example

```ts
// Remove default storage
await epos.storage.remove()

// Remove named storage
await epos.storage.remove('old-cache')
```

::: warning
This permanently deletes all keys in the storage. This action cannot be undone.
:::

## epos.storage.for()

Create a storage API instance bound to a specific storage name. This is useful for organizing related data.

```ts
epos.storage.for(name?: string): {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<void>
  keys(): Promise<string[]>
  remove(): Promise<void>
}
```

### Parameters

- `name` - Optional storage name. If not provided, uses default storage

### Returns

An object with storage methods bound to the specified storage.

### Example

```ts
// Create storage instance for authentication
const authStorage = epos.storage.for('auth')

// Use the instance
await authStorage.set('token', 'abc123...')
await authStorage.set('refreshToken', 'def456...')
const token = await authStorage.get<string>('token')
const keys = await authStorage.keys()

// Remove all auth data
await authStorage.remove()
```

## Usage Patterns

### Simple Key-Value Storage

```ts
// Store user preferences
await epos.storage.set('theme', 'dark')
await epos.storage.set('language', 'en')
await epos.storage.set('notifications', true)

// Retrieve later
const theme = await epos.storage.get<string>('theme')
const notifications = await epos.storage.get<boolean>('notifications')
```

### Organized Storage with Namespaces

```ts
// Create separate storage instances
const authStorage = epos.storage.for('auth')
const cacheStorage = epos.storage.for('cache')
const settingsStorage = epos.storage.for('settings')

// Store auth data
await authStorage.set('token', 'abc123...')
await authStorage.set('userId', '12345')

// Store cache data
await cacheStorage.set('user:123', { name: 'John', email: 'john@example.com' })
await cacheStorage.set('post:456', { title: 'Hello World' })

// Store settings
await settingsStorage.set('theme', 'dark')
await settingsStorage.set('language', 'en')
```

### Cache Implementation

```ts
const cache = epos.storage.for('cache')

async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600000, // 1 hour
): Promise<T> {
  // Check cache
  const cached = await cache.get<{ data: T; timestamp: number }>(key)

  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data
  }

  // Fetch fresh data
  const data = await fetcher()

  // Store in cache
  await cache.set(key, {
    data,
    timestamp: Date.now(),
  })

  return data
}

// Usage
const userData = await getCachedData('user:123', () => fetch('/api/user/123').then(r => r.json()))
```

### Storage Migration

```ts
// Check if migration is needed
const version = await epos.storage.get<number>('migration:version')

if (!version || version < 2) {
  // Migrate old data
  const oldTheme = await epos.storage.get('theme')

  if (oldTheme) {
    // Move to new storage
    const settings = epos.storage.for('settings')
    await settings.set('theme', oldTheme)
    await epos.storage.delete('theme')
  }

  // Mark migration complete
  await epos.storage.set('migration:version', 2)
}
```

### Cleanup Old Data

```ts
// Get all cache keys
const cacheStorage = epos.storage.for('cache')
const keys = await cacheStorage.keys()

// Remove old entries
for (const key of keys) {
  const entry = await cacheStorage.get<{ timestamp: number }>(key)

  // Remove if older than 7 days
  if (entry && Date.now() - entry.timestamp > 7 * 24 * 60 * 60 * 1000) {
    await cacheStorage.delete(key)
  }
}
```

### Storage Inspector

```ts
// List all storages and their contents
const storages = await epos.storage.list()

for (const storage of storages) {
  const name = storage.name || '(default)'
  console.log(`Storage: ${name}`)
  console.log(`Keys: ${storage.keys.length}`)

  for (const key of storage.keys) {
    const value = await epos.storage.get(storage.name || undefined, key)
    console.log(`  ${key}:`, value)
  }
}
```

## Storage vs State

| Feature         | Storage                 | State                          |
| --------------- | ----------------------- | ------------------------------ |
| Synchronization | ❌ Manual               | ✅ Automatic                   |
| Persistence     | ✅ Yes                  | ✅ Yes                         |
| Performance     | Fast for read/write     | Optimized for frequent updates |
| Use Case        | Cache, settings, tokens | App state, UI state            |
| API             | Key-value               | Observable objects             |

::: tip
Use **storage** for data that doesn't need real-time synchronization (cache, tokens, preferences).  
Use **state** for data that needs to be synchronized across contexts (app state, UI state).
:::

::: warning
Storage names starting with `:` are reserved for internal use (except `:storage`).
:::
