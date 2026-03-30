::: warning

This is an AI-generated draft based on the Epos source code.

:::

# epos.storage.\*

`epos.storage` is a persistent key-value storage backed by IndexedDB.

Unlike shared state, it does not sync live updates across contexts.

## Names

- If you omit the storage name, Epos uses the default storage.
- Custom storage names cannot start with `:`.
- In `list()`, the default storage is reported as `name: null`.

## epos.storage.get()

```ts
epos.storage.get<T>(key: string): Promise<T | null>
epos.storage.get<T>(name: string, key: string): Promise<T | null>
```

Gets a value by key.

## epos.storage.set()

```ts
epos.storage.set<T>(key: string, value: T): Promise<void>
epos.storage.set<T>(name: string, key: string, value: T): Promise<void>
```

Stores a value by key.

## epos.storage.has()

```ts
epos.storage.has(key: string): Promise<boolean>
epos.storage.has(name: string, key: string): Promise<boolean>
```

Checks whether a key exists.

## epos.storage.delete()

```ts
epos.storage.delete(key: string): Promise<void>
epos.storage.delete(name: string, key: string): Promise<void>
```

Deletes one key.

## epos.storage.keys()

```ts
epos.storage.keys(name?: string): Promise<string[]>
```

Returns all keys from one storage.

## epos.storage.list()

```ts
epos.storage.list(): Promise<{ name: string | null; keys: string[] }[]>
```

Lists all storages for the current project.

## epos.storage.clear()

```ts
epos.storage.clear(name?: string): Promise<void>
```

Deletes a whole storage and all of its keys.

## epos.storage.for()

```ts
epos.storage.for(name?: string): {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown): Promise<void>
  has(key: string): Promise<boolean>
  delete(key: string): Promise<void>
  keys(): Promise<string[]>
  clear(): Promise<void>
}
```

Returns a storage helper already bound to one storage name.

### Example

```ts
const settings = epos.storage.for('settings')

await settings.set('theme', 'dark')
const theme = await settings.get<string>('theme')
```

## Notes

- Storage is isolated per project.
- Values can include blobs, files, and other binary data, not just plain JSON.

### Example

```ts
const blob = new Blob(['hello'])
await epos.storage.set('file', blob)
```
