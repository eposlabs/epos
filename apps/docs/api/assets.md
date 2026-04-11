::: warning

This is an AI-generated draft based on the Epos source code.

:::

# epos.assets.\*

`epos.assets` gives access to the files declared in the project's `assets` field.

Assets are stored persistently and can also be loaded into memory as object URLs.

## Paths

Asset paths are normalized before lookup.

These forms are treated as the same path:

- `logo.png`
- `/logo.png`
- `./logo.png`
- `images/./logo.png`

If the normalized path is not in the project assets list, the API throws.

## epos.assets.url()

```ts
epos.assets.url(path: string): string
```

Returns an object URL for a loaded asset.

### Notes

- The asset must already be loaded with `load()`.
- If the asset exists but is not loaded, this throws with a hint to call `load()` first.

## epos.assets.get()

```ts
epos.assets.get(path: string): Promise<Blob | null>
```

Returns the asset as a `Blob`.

### Notes

- If the asset is already loaded, the in-memory blob is returned.
- Otherwise Epos reads it directly from IndexedDB.
- Reading an unloaded asset this way does not keep it loaded in memory afterward.

## epos.assets.list()

```ts
epos.assets.list(filter?: { loaded?: boolean }): { path: string; loaded: boolean }[]
```

Lists the declared assets and whether each one is currently loaded.

## epos.assets.load()

```ts
epos.assets.load(): Promise<void>
epos.assets.load(path: string): Promise<void>
```

Loads one asset or all assets into memory.

### Notes

- Calling `load()` twice for the same asset is safe.
- Loaded assets get an object URL that stays valid until `unload()`.

## epos.assets.unload()

```ts
epos.assets.unload(): void
epos.assets.unload(path: string): void
```

Unloads one asset or all assets from memory.

### Notes

- This revokes the generated object URLs.
- It does not delete the asset from project storage.

### Example

```ts
await epos.assets.load('logo.png')

const img = document.createElement('img')
img.src = epos.assets.url('logo.png')
```
