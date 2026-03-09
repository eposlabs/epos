# Assets

Assets are static files bundled with your project, such as images, fonts, JSON files, or media.

You list them in `epos.json`, and then access them through `epos.assets`.

This guide covers the practical workflow. For exact method signatures, see the [Assets API Reference](/api/assets).

## Defining Assets

Suppose your project contains `public/view.jpg`. To make it available at runtime, add it to the `assets` field in `epos.json`:

::: code-group

```json [epos.json]
{
  "name": "My Extension",
  "assets": ["public/view.jpg"]
}
```

:::

Once a file is listed there, Epos treats it as part of your project bundle.

## Using Asset URLs

The most common method is `epos.assets.url()`. It returns a blob URL that you can use in `src`, `href`, CSS, and similar places.

```tsx
const App = () => {
  return <img src={epos.assets.url('public/view.jpg')} alt="View" />
}

epos.render(<App />)
```

Paths are normalized, so these forms all work if the asset exists:

- `public/view.jpg`
- `./public/view.jpg`
- `/public/view.jpg`

But the file still needs to be listed in `epos.json`. If you ask for `view.jpg` when only `public/view.jpg` exists, Epos throws an error.

## Reading Asset Contents

If you need the file itself instead of a URL, use `epos.assets.get()`.

```ts
const blob = await epos.assets.get('public/data.json')

if (blob) {
  const text = await blob.text()
  console.log(text)
}
```

This is useful for JSON, text files, templates, or binary data you want to process yourself.

## Preloading and Manual Loading

By default, Epos preloads assets so `epos.assets.url()` works immediately.

If you want manual control, disable preloading in `epos.json`:

```json
{
  "name": "My Extension",
  "assets": ["public/view.jpg", "public/heavy.mp4"],
  "options": {
    "preloadAssets": false
  }
}
```

Then load assets yourself:

```ts
await epos.assets.load('public/view.jpg')

const url = epos.assets.url('public/view.jpg')
```

You can also load everything at once:

```ts
await epos.assets.load()
```

This setup is useful when you have large files and do not want all of them in memory from the start.

## Unloading Assets

To release memory, use `epos.assets.unload()`.

```ts
epos.assets.unload('public/heavy.mp4')

// Or unload everything
epos.assets.unload()
```

This only affects the in-memory loaded asset URLs. It does not remove the asset from the project.

## Listing Assets

`epos.assets.list()` shows which assets exist and whether they are currently loaded.

```ts
const allAssets = epos.assets.list()
const loadedAssets = epos.assets.list({ loaded: true })
const unloadedAssets = epos.assets.list({ loaded: false })
```

This method is synchronous.

## How It Works

Epos stores project assets in IndexedDB. When needed, they are loaded into memory and exposed as blob URLs.

That is why `epos.assets.url()` can work in any context, including normal web pages.

## Notes

- `url()` throws if the asset does not exist or is not loaded.
- `get()` can still read an asset even if you did not load it manually.
- Epos does not currently support glob patterns such as `public/*.jpg` in the `assets` field. List each asset explicitly.
