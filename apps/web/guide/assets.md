# Assets

Assets are static files bundled with your project, such as images, fonts, or any other files. You list them in `epos.json` and then access them through `epos.assets`.

Internally, Epos stores assets in IndexedDB and loads them into memory when needed.

This guide covers the practical workflow. For exact method signatures, see the [Assets API Reference](/api/assets).

## Defining Assets

Suppose your project contains `static/logo.png`. To make it available in your extension, add it to the `assets` field in `epos.json`:

::: code-group

```json {3} [epos.json]
{
  "name": "My Extension",
  "assets": ["static/logo.png"]
}
```

:::

Once a file is listed there, Epos includes it in your project bundle.

## Using Asset URLs

The most common method is `epos.assets.url()`. It returns a URL that you can use:

<!-- prettier-ignore -->
```tsx {4}
const Logo = () => {
  return (
    <img
      src={epos.assets.url('static/logo.png')}
      alt="Logo"
    />
  )
}

epos.render(<Logo />)
```

Paths passed to `url()` are normalized, so all these variations work the same:

- `static/logo.png`
- `/static/logo.png`
- `./static/logo.png`

But the file still has to be listed in `epos.json`. If you ask for `logo.png` when only `static/logo.png` exists, Epos throws an error.

## Reading Asset Contents

If you need the file itself instead of a URL, use `epos.assets.get()`:

```ts
const blob = await epos.assets.get('static/data.json')

if (blob) {
  const data = JSON.parse(await blob.text())
  console.log(data)
}
```

## Preloading

By default, Epos preloads assets when your app starts.

This is fine for most projects. If you have large files, you may prefer to load them only when you need them.

To disable auto-loading, set `options.preloadAssets: false` in `epos.json`:

::: code-group

```json {4} [epos.json]
{
  "name": "My Extension",
  "assets": ["static/logo.png", "static/heavy.mp4"],
  "options": { "preloadAssets": false }
}
```

:::

This way, assets stay unloaded until you load them explicitly.

## Manual Loading

To load an asset into memory, use `load()`:

```ts
// First, load the asset
await epos.assets.load('static/logo.png')

// Then you can access its URL
const url = epos.assets.url('static/logo.png')
```

Calling `url()` on an unloaded asset throws an error, so make sure to load it first.

To load all available assets, call `load()` without arguments:

```ts
// Load all assets
await epos.assets.load()
```

In most projects, auto-loading is sufficient. Use manual loading only when you have large files that you do not want in memory from the start.

## `url()` vs `get()`

- `epos.assets.url()` is **synchronous** and **throws** if the asset is not loaded first.

- `epos.assets.get()` is **asynchronous** and can read the asset even if it is not loaded.

Why is `get()` async, but `url()` is not? `url()` is mostly used during rendering, where the URL needs to be available synchronously. In contrast, `get()` reads the actual file content, so it can fetch it from IndexedDB when needed.

If you call `get()` for an asset that is not loaded, Epos does not keep that asset in memory afterward. It just reads the file from IndexedDB and returns it.

## Unloading Assets

An asset stays in memory until you unload it explicitly or until the context is destroyed (e.g. popup closed). To unload it manually, use `unload()`:

```ts
// Unload a specific asset
epos.assets.unload('static/logo.png')
```

This method is synchronous and removes the asset from memory.

To unload all assets, call `unload()` without arguments:

```ts
// Unload all assets
epos.assets.unload()
```

## Listing Assets

`epos.assets.list()` shows which assets exist and whether they are currently loaded:

```ts
const assets = epos.assets.list()
// [
//   { path: 'static/logo.png', loaded: true },
//   { path: 'static/heavy.mp4', loaded: false }
// ]
```

Alternatively, you can filter by loaded status:

```ts
const loadedAssets = epos.assets.list({ loaded: true })
const unloadedAssets = epos.assets.list({ loaded: false })
```

## How It Works

Epos stores project assets in IndexedDB. When needed, it loads them into memory and exposes them as blob URLs.

Assets are loaded per context. If you load an asset in the background, it is not automatically loaded in the popup or page code.

## Glob Patterns

Epos **does not support** glob patterns such as `static/*.png` in the `assets` field. List each asset explicitly.
