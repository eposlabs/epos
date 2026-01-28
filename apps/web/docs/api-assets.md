---
outline: [2, 3]
---

# Assets API

The assets API provides access to static files bundled with your extension. Assets are defined in your `epos.json` and can be loaded on-demand or preloaded.

## epos.assets.url()

Get a URL for an asset. The asset must be loaded first using `load()`.

```ts
epos.assets.url(path: string): string
```

### Parameters

- `path` - The asset path as defined in your `epos.json`

### Returns

A blob URL that can be used in src attributes, fetch calls, etc.

### Throws

An error if the asset is not loaded or not found.

### Example

```ts
// Load the asset first
await epos.assets.load('logo.png')

// Get the URL
const logoUrl = epos.assets.url('logo.png')

// Use in img tag
const img = document.createElement('img')
img.src = logoUrl

// Or in React
<img src={epos.assets.url('logo.png')} alt="Logo" />
```

## epos.assets.get()

Get an asset as a Blob.

```ts
epos.assets.get(path: string): Promise<Blob | null>
```

### Parameters

- `path` - The asset path as defined in your `epos.json`

### Returns

A Promise that resolves to the asset Blob, or `null` if not found.

### Example

```ts
// Get asset as Blob
const blob = await epos.assets.get('data.json')

if (blob) {
  const text = await blob.text()
  const data = JSON.parse(text)
  console.log(data)
}

// Get image
const imageBlob = await epos.assets.get('photo.jpg')
if (imageBlob) {
  const url = URL.createObjectURL(imageBlob)
  img.src = url
}
```

## epos.assets.list()

Get a list of all available assets with their load status.

```ts
epos.assets.list(
  filter?: { loaded?: boolean }
): { path: string; loaded: boolean }[]
```

### Parameters

- `filter` - Optional filter object
  - `loaded` - If `true`, only returns loaded assets. If `false`, only returns unloaded assets

### Returns

An array of asset info objects.

### Example

```ts
// Get all assets
const allAssets = epos.assets.list()
console.log(allAssets)
// [
//   { path: 'logo.png', loaded: true },
//   { path: 'data.json', loaded: false },
//   { path: 'styles.css', loaded: true }
// ]

// Get only loaded assets
const loaded = epos.assets.list({ loaded: true })

// Get only unloaded assets
const unloaded = epos.assets.list({ loaded: false })
```

## epos.assets.load()

Load assets into memory. Can load a specific asset or all assets.

```ts
epos.assets.load(): Promise<void>
epos.assets.load(path: string): Promise<void>
```

### Parameters

- `path` - Optional asset path. If not provided, loads all assets

### Example

```ts
// Load a specific asset
await epos.assets.load('logo.png')
const url = epos.assets.url('logo.png')

// Load all assets
await epos.assets.load()

// Now all assets are available
const logo = epos.assets.url('logo.png')
const data = epos.assets.url('data.json')
const styles = epos.assets.url('styles.css')
```

## epos.assets.unload()

Unload assets from memory to free up resources. Can unload a specific asset or all assets.

```ts
epos.assets.unload(): void
epos.assets.unload(path: string): void
```

### Parameters

- `path` - Optional asset path. If not provided, unloads all assets

### Example

```ts
// Unload a specific asset
epos.assets.unload('large-image.png')

// Unload all assets
epos.assets.unload()
```

## Asset Configuration

Assets are defined in your `epos.json`:

```json
{
  "name": "My Extension",
  "assets": ["logo.png", "data.json", "styles.css", "images/banner.jpg"],
  "config": {
    "preloadAssets": false
  }
}
```

### Preloading

If `config.preloadAssets` is `true`, all assets are automatically loaded when your extension starts. Otherwise, you need to load them manually.

## Usage Patterns

### Load on Demand

```ts
async function showLogo() {
  // Load only when needed
  await epos.assets.load('logo.png')

  const img = document.createElement('img')
  img.src = epos.assets.url('logo.png')
  document.body.appendChild(img)
}
```

### Preload Critical Assets

```ts
// In your initialization code
async function init() {
  // Preload critical assets
  await Promise.all([
    epos.assets.load('logo.png'),
    epos.assets.load('config.json'),
    epos.assets.load('main.css')
  ])

  // Now render UI
  epos.render(<App />)
}

init()
```

### Lazy Loading Images

```ts
const LazyImage: React.FC<{ path: string; alt: string }> = epos.component(
  ({ path, alt }) => {
    const [loaded, setLoaded] = React.useState(false)
    const [url, setUrl] = React.useState('')

    React.useEffect(() => {
      epos.assets.load(path).then(() => {
        setUrl(epos.assets.url(path))
        setLoaded(true)
      })
    }, [path])

    if (!loaded) {
      return <div>Loading...</div>
    }

    return <img src={url} alt={alt} />
  }
)

// Usage
<LazyImage path="photo.jpg" alt="Photo" />
```

### Load JSON Data

```ts
async function loadConfig() {
  const blob = await epos.assets.get('config.json')

  if (!blob) {
    throw new Error('Config not found')
  }

  const text = await blob.text()
  const config = JSON.parse(text)

  return config
}

const config = await loadConfig()
console.log(config)
```

### Resource Management

```ts
class AssetManager {
  loaded = new Set<string>()

  async load(path: string) {
    if (!this.loaded.has(path)) {
      await epos.assets.load(path)
      this.loaded.add(path)
    }
    return epos.assets.url(path)
  }

  unload(path: string) {
    if (this.loaded.has(path)) {
      epos.assets.unload(path)
      this.loaded.delete(path)
    }
  }

  unloadAll() {
    epos.assets.unload()
    this.loaded.clear()
  }
}

const assets = new AssetManager()

// Load and get URL
const logoUrl = await assets.load('logo.png')

// Cleanup when done
assets.unloadAll()
```

### Progress Indicator

```ts
async function loadAllAssetsWithProgress(onProgress: (loaded: number, total: number) => void) {
  const assets = epos.assets.list({ loaded: false })
  const total = assets.length
  let loaded = 0

  for (const asset of assets) {
    await epos.assets.load(asset.path)
    loaded++
    onProgress(loaded, total)
  }
}

// Usage
await loadAllAssetsWithProgress((loaded, total) => {
  console.log(`Loading: ${loaded}/${total}`)
  // Update progress bar
})
```

### Image Gallery

```ts
const Gallery: React.FC = epos.component(() => {
  const images = epos.assets.list({ loaded: false })
    .filter(asset => asset.path.match(/\.(jpg|png|gif)$/))

  React.useEffect(() => {
    // Load all images
    Promise.all(images.map(img => epos.assets.load(img.path)))
  }, [])

  const loadedImages = epos.assets.list({ loaded: true })
    .filter(asset => asset.path.match(/\.(jpg|png|gif)$/))

  return (
    <div className="gallery">
      {loadedImages.map(img => (
        <img
          key={img.path}
          src={epos.assets.url(img.path)}
          alt={img.path}
        />
      ))}
    </div>
  )
})
```

### Dynamic Import

```ts
async function loadAndExecuteScript(path: string) {
  // Load script asset
  const blob = await epos.assets.get(path)

  if (!blob) {
    throw new Error(`Script not found: ${path}`)
  }

  // Get script content
  const code = await blob.text()

  // Execute in isolated scope
  const fn = new Function(code)
  fn()
}

await loadAndExecuteScript('plugin.js')
```

## Path Normalization

Asset paths are normalized automatically:

- `a/c` → `a/c`
- `a/c/` → `a/c`
- `/a/c/` → `a/c`
- `./a/c` → `a/c`
- `a/./c` → `a/c`

::: tip
If `config.preloadAssets` is `true` in your `epos.json`, you can use `epos.assets.url()` immediately without calling `load()`.
:::

::: warning
Always call `epos.assets.load()` before `epos.assets.url()` unless preloading is enabled. Calling `url()` on an unloaded asset will throw an error.
:::
