# Assets API

The **Assets API** manages your project’s static assets — images, scripts, styles, or any other files.  
Assets are loaded into memory as `Blob`s and can then be accessed via generated object URLs.

## `epos.assets.url`

Returns a URL for a previously loaded static file.  
The file must be loaded first using [`epos.assets.load`](#epos-assets-load).

**Usage**

```ts
epos.assets.url(path: string): string
```

**Example**

```js
await epos.assets.load('./images/icon.png')
const src = epos.assets.url('./images/icon.png')
document.querySelector('img').src = src
```

## `epos.assets.load`

Loads a static file by its relative path and returns a `Blob`.
If the file was already loaded, it is retrieved from memory cache.

**Usage**

```ts
// Load all assets (ok for most cases, but should be avoided for large files)
epos.assets.load(): Promise<void>

// Load a specific asset
epos.assets.load(path: string): Promise<Blob>
```

**Example**

```js
const blob = await epos.assets.load('./data/info.json')
const text = await blob.text()
console.log(text)
```

## `epos.assets.unload`

Removes a specific static file from memory.
The file can be reloaded later using `load()` again.

**Usage**

```ts
// Unload all loaded assets
epos.assets.unload(): void

// Unload a specific asset. If asset is not loaded, does nothing.
epos.assets.unload(path: string): void
```

**Example**

```js
epos.assets.unload('./images/icon.png')
```

## `epos.assets.list`

Returns a list of all static files known to the project, including whether each file is currently loaded in memory.

**Usage**

```ts
epos.assets.list(filter?: { loaded?: boolean }): { path: string; loaded: boolean }[]
```

**Example**

```js
const files = epos.assets.list()
console.table(files)
```

---

Static files are bundled together with your project and managed by Epos at runtime.
They stay cached in memory once loaded, and can be safely unloaded when no longer needed.
