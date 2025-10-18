# Static API

The **Static API** manages your project’s static assets — images, scripts, styles, or any other bundled files.  
Files are loaded into memory as `Blob`s and can then be accessed via generated object URLs.  
This allows for efficient resource reuse across different contexts without redundant network requests.

## `epos.static.url`

Returns a URL for a previously loaded static file.  
The file must be loaded first using [`epos.static.load`](#epos-static-load).

**Usage**

```ts
epos.static.url(path: string): string
```

**Example**

```js
await epos.static.load('./images/icon.png')
const src = epos.static.url('./images/icon.png')
document.querySelector('img').src = src
```

## `epos.static.load`

Loads a static file by its relative path and returns a `Blob`.
If the file was already loaded, it is retrieved from memory cache.

**Usage**

```ts
epos.static.load(path: string): Promise<Blob>
```

**Example**

```js
const blob = await epos.static.load('./data/info.json')
const text = await blob.text()
console.log(text)
```

## `epos.static.loadAll`

Loads **all** static files defined for your project (as listed in your `epos.json` manifest).
Useful during startup or preloading phases.

**Usage**

```ts
epos.static.loadAll(): Promise<Blob[]>
```

**Example**

```js
await epos.static.loadAll()
console.log('All assets are ready')
```

## `epos.static.unload`

Removes a specific static file from memory.
The file can be reloaded later using `load()` again.

**Usage**

```ts
epos.static.unload(path: string): void
```

**Example**

```js
epos.static.unload('./images/icon.png')
```

## `epos.static.unloadAll`

Removes **all** loaded static files from memory.

**Usage**

```ts
epos.static.unloadAll(): void
```

**Example**

```js
epos.static.unloadAll()
```

## `epos.static.list`

Returns a list of all static files known to the project, including whether each file is currently loaded in memory.

**Usage**

```ts
epos.static.list(filter?: { loaded?: boolean }): { path: string; loaded: boolean }[]
```

**Example**

```js
const files = epos.static.list()
console.table(files)
```

---

Static files are bundled together with your project and managed by Epos at runtime.
They stay cached in memory once loaded, and can be safely unloaded when no longer needed.
