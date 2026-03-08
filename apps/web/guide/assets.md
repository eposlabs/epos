# Assets

In this section, we will cover how to use static files (assets) in your Epos projects. This includes images, fonts, and any other files that you want to include in your extension.

## Defining Assets

Let's say we want `public/view.jpg` to be available as an asset. If you need a placeholder image to test with, you can download this one: `https://picsum.photos/300/300`.

Now we need add this file to the `assets` array in `epos.json`:

::: code-group

```json [epos.json]
{
  "name": "My Extension",
  "assets": ["public/view.jpg"], // [!code ++]
  ...
}
```

:::

## Using Assets

After you define an asset, you can get its URL with `epos.assets.url()`:

```tsx
const App = epos.component(() => {
  return <img src={epos.assets.url('public/view.jpg')} />
})

epos.render(<App />)
```

You can provide any variation for the path. For example `./public/view.jpg` and `/public/view.jpg` will also work. But you should provide correct path, if you wil use `epos.assets.url('view.jpg')`, Epos will throw an error as the asset file does not exist.

## ⬇︎ ADVANCED ⬇︎

## How Assets Work

Since Epos loads projects dynamically, it can't just reference files from your local folder. Instead, when Epos consumes your project, it saves all assets into IndexedDB. When your project starts, assets are automatically loaded from IndexedDB into memory.

When you call `epos.assets.url()`, Epos creates an [object URL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static) for the specified file.

The assets API works in any context, including regular web pages.

## Heavy Assets

In most cases assets are relatively small files and loading them into memory is not a problem. However, if you have large files that you don't want to load until necessary, you can disable automatic assets preloading in `epos.json`:

```json [epos.json]
{
  "name": "My Extension",
  "assets": ["public/view.jpg", "public/heavy.mp4"],
  "options": { "preloadAssets": false } // [!code ++]
  ...
}
```

Once you disable preloading, assets will not be loaded into memory automatically. Instead, you will need to call `epos.assets.load()` manually to load assets into memory. If you call `epos.assets.load()` without any arguments, it will load all assets into memory.

```ts
// Will throw an error if asset is not loaded
epos.assets.url('public/view.jpg')

await epos.assets.load('public/view.jpg')
epos.assets.url('public/view.jpg') // Works now

// Load ALL assets
await epos.assets.load()
```

To unload, use `epos.assets.unload()`:

```ts
// Unload a specific asset
epos.assets.unload('public/view.jpg')

// Unload ALL assets
epos.assets.unload()
```

## Other Asset APIs

If you need to read the contents of an asset file and not the URL, you can use `epos.assets.get()`:

```ts
const blob = await epos.assets.get('public/view.jpg')
console.log(blob.size, blob.type)
```

Note that `get()` is asynchronous compared to `url()` method. If asset is not loaded, `get()` will load it first. You may wonder why `url()` is not asynchronous also. The reason is that in most cases you want to use url inside rendering (provide path to image/video/font) and making it asynchronous would make it more difficult to use.

To list all available assets, use `epos.assets.list()`:

```ts
// Array<{ path: string, loaded: boolean }>
const assets = await epos.assets.list()

for (const asset of assets) {
  console.log(asset.path, asset.loaded)
}
```

Additionally you can provide a filter object to `list()` method and filter only loaded/unloaded assets:

```ts
// List only loaded assets
const loadedAssets = await epos.assets.list({ loaded: true })

// List only unloaded assets
const unloadedAssets = await epos.assets.list({ loaded: false })
```

## Caveats

At the moment, Epos does not provide a way to define assets using a glob pattern, so providing `public/*.jpg` won't work. You need to list each file separately in `epos.json`. If you have a lot of assets, you still have to list all of them. The glob pattern support may be added in the future.
