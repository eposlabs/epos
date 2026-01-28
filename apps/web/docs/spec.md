# epos.json Specification

The `epos.json` file is the configuration file for your Epos extension. It defines what your extension does, where to load code, what permissions it needs, and how it should behave.

## Basic Structure

```json
{
  "name": "My Extension",
  "slug": "my-extension",
  "version": "1.0.0",
  "description": "A useful extension",
  "icon": "icon.png",
  "action": true,
  "popup": { "width": 380, "height": 572 },
  "config": {
    "preloadAssets": false,
    "allowProjectsApi": false,
    "allowMissingModels": false
  },
  "assets": ["icon.png", "data.json"],
  "targets": [
    {
      "matches": ["<popup>"],
      "load": ["popup.js", "popup.css"]
    },
    {
      "matches": ["*://example.com/*"],
      "load": ["web.js", "web.css"]
    }
  ],
  "permissions": ["storage", "notifications"],
  "manifest": null
}
```

## Fields

### name

The display name of your extension. Required.

- **Type:** `string`
- **Min length:** 2 characters
- **Max length:** 45 characters

```json
{
  "name": "My Awesome Extension"
}
```

### slug

A unique identifier for your extension. Used internally for directory and database names.

- **Type:** `string`
- **Min length:** 2 characters
- **Max length:** 45 characters
- **Format:** lowercase letters, numbers, and hyphens; must start and end with a letter or number
- **Default:** Auto-generated from `name` if not provided

```json
{
  "slug": "my-extension"
}
```

::: tip
If you don't provide a slug, it's automatically generated from the name (e.g., "My Extension" → "my-extension").
:::

### version

Your extension's version number. Should follow semantic versioning.

- **Type:** `string`
- **Format:** `V.V.V`, `V.V`, or `V` (e.g., `1.0.0`, `2.5`, `3`)
- **Default:** `0.0.1`

```json
{
  "version": "1.2.3"
}
```

### description

A brief description of what your extension does.

- **Type:** `string | null`
- **Max length:** 132 characters
- **Default:** `null`

```json
{
  "description": "Enhances your browsing experience with custom features"
}
```

### icon

Path to your extension's icon file. Used in the extension UI and Chrome Web Store.

- **Type:** `string | null`
- **Default:** `null`

```json
{
  "icon": "icon.png"
}
```

::: tip
The icon is automatically added to your assets list if specified.
:::

### action

Whether to show an action button (icon) in the Chrome toolbar. Set to `true` for a default icon, or provide a URL for a custom icon.

- **Type:** `true | string | null`
- **Default:** `null` (auto-detected based on targets)
- **Note:** Automatically set to `null` if your extension has a popup or side panel

```json
{
  "action": true
}
```

```json
{
  "action": "https://example.com/icon.png"
}
```

### popup

Configuration for the extension's popup UI.

- **Type:** `object`
- **Defaults:** `{ width: 380, height: 572 }`

#### popup.width

Width of the popup in pixels.

- **Type:** `number`
- **Min:** 150px
- **Max:** 800px
- **Default:** 380px

#### popup.height

Height of the popup in pixels.

- **Type:** `number`
- **Min:** 150px
- **Max:** 572px
- **Default:** 572px

```json
{
  "popup": {
    "width": 400,
    "height": 600
  }
}
```

### config

Extension configuration options.

#### config.preloadAssets

If `true`, all assets are automatically loaded when your extension starts. If `false`, you must call `epos.assets.load()` manually.

- **Type:** `boolean`
- **Default:** `true`

```json
{
  "config": {
    "preloadAssets": false
  }
}
```

#### config.allowProjectsApi

If `true`, enables the `epos.projects` API for programmatic project management. This is a powerful feature that should only be enabled if needed.

- **Type:** `boolean`
- **Default:** `false`

```json
{
  "config": {
    "allowProjectsApi": true
  }
}
```

#### config.allowMissingModels

If `true`, state objects can be created without being registered in `epos.state.register()`. Only enable if you know what you're doing.

- **Type:** `boolean`
- **Default:** `false`

```json
{
  "config": {
    "allowMissingModels": false
  }
}
```

### assets

List of static files to bundle with your extension. These files are accessible via `epos.assets.url()` and `epos.assets.get()`.

- **Type:** `string[]`
- **Default:** `[]`

```json
{
  "assets": ["icon.png", "logo.svg", "data.json", "styles/theme.css"]
}
```

::: tip
Your icon is automatically added to assets if specified in the `icon` field.
:::

### targets

Define where your code runs. Each target specifies what code to load in specific contexts (popup, background, content scripts, etc.).

- **Type:** `Target[]`
- **Required:** At least one target

#### Target Object

```ts
{
  matches: Match[]
  load: string[]
}
```

##### matches

Array of match patterns specifying where this target applies.

**Special contexts (always available):**

- `<popup>` - Extension popup
- `<sidePanel>` - Extension side panel
- `<background>` - Background service worker

**URL patterns (use for web pages):**

- `*://example.com/*` - Any page on example.com
- `*://*.example.com/*` - Any subdomain of example.com
- `<allUrls>` - All URLs
- `*://*/* ` - Any http/https URL

**Frame matching:**

- `frame:*://example.com/*` - Only in iframes

**URL path matching:**

- `exact:*://example.com/path` - Exact URL (no query string matching by default)

```json
{
  "targets": [
    {
      "matches": ["<popup>"],
      "load": ["popup.js"]
    },
    {
      "matches": ["*://*.example.com/*"],
      "load": ["web.js", "web.css"]
    }
  ]
}
```

##### load

Array of JavaScript and CSS files to load in this target. Order matters—files are loaded in the order specified.

**File types:**

- `.js` files are treated as scripts
- `.css` files are treated as stylesheets

**Prefixes:**

- `lite:` - Load as a lightweight script (minimal isolation)
- `shadow:` - Load CSS in shadow DOM (for web page content)

```json
{
  "load": ["popup.js", "popup.css", "lite:utils.js", "shadow:isolated.css"]
}
```

### permissions

List of browser permissions your extension needs.

- **Type:** `string[]`
- **Default:** `[]`

#### Available Permissions

- `background` - Run a background service worker
- `storage` - Access browser storage API
- `notifications` - Create notifications
- `cookies` - Access cookies
- `contextMenus` - Add context menu items
- `downloads` - Manage downloads
- `browsingData` - Clear browsing data

**Optional permissions:**
Prefix with `optional:` to request permission only when needed.

```json
{
  "permissions": ["storage", "notifications", "optional:cookies"]
}
```

::: tip
Use `optional:` prefix for permissions you only need in certain situations. Users can grant them through your UI.
:::

### manifest

Custom manifest overrides. Advanced feature for fine-tuning the generated Chrome manifest.

- **Type:** `object | null`
- **Default:** `null`

```json
{
  "manifest": {
    "homepage_url": "https://example.com"
  }
}
```

::: warning
This field is for advanced users. Most use cases don't need this.
:::

## Complete Example

Here's a complete `epos.json` with all features:

```json
{
  "name": "Todo Manager",
  "slug": "todo-manager",
  "version": "2.1.0",
  "description": "Manage your todos across all tabs",
  "icon": "icon.png",
  "action": true,
  "popup": {
    "width": 400,
    "height": 600
  },
  "config": {
    "preloadAssets": true,
    "allowProjectsApi": false,
    "allowMissingModels": false
  },
  "assets": ["icon.png", "logo.svg", "data/defaults.json", "styles/theme.css"],
  "targets": [
    {
      "matches": ["<popup>"],
      "load": ["popup.js", "popup.css"]
    },
    {
      "matches": ["<background>"],
      "load": ["background.js"]
    },
    {
      "matches": ["*://*.example.com/*"],
      "load": ["web.js", "shadow:web.css"]
    }
  ],
  "permissions": ["storage", "notifications", "optional:contextMenus"],
  "manifest": null
}
```

## Comments in epos.json

You can add comments to your `epos.json` file (they will be stripped during parsing):

```json
{
  // Display name
  "name": "My Extension",

  // Unique slug
  "slug": "my-extension",

  "version": "1.0.0"
  // ... rest of config
}
```

## Match Pattern Reference

### Context Matching

| Pattern        | Description               |
| -------------- | ------------------------- |
| `<popup>`      | Extension popup window    |
| `<sidePanel>`  | Extension side panel      |
| `<background>` | Background service worker |

### URL Matching

| Pattern                      | Matches                     |
| ---------------------------- | --------------------------- |
| `*://example.com/*`          | example.com on any protocol |
| `*://*.example.com/*`        | example.com and subdomains  |
| `*://*/* `                   | Any http/https URL          |
| `<allUrls>`                  | Equivalent to `*://*/*`     |
| `exact:*://example.com/path` | Exact URL only              |
| `frame:*://example.com/*`    | Only in iframes             |

### Examples

```json
{
  "targets": [
    {
      "matches": ["<popup>", "<background>"],
      "load": ["ui.js"]
    },
    {
      "matches": ["*://*.github.com/*", "*://*.gitlab.com/*"],
      "load": ["code-host.js"]
    },
    {
      "matches": ["frame:*://example.com/*"],
      "load": ["iframe.js"]
    }
  ]
}
```

## Loading Order

Files in each target are loaded in the order specified:

```json
{
  "targets": [
    {
      "matches": ["<popup>"],
      "load": [
        "vendor.js", // Loads first
        "utils.js", // Then this
        "components.js", // Then this
        "app.js", // Finally this
        "styles.css" // CSS after scripts
      ]
    }
  ]
}
```

## Performance Tips

### Preload vs On-Demand

```json
{
  "config": {
    "preloadAssets": false // Don't preload if you have many assets
  },
  "assets": ["large-image.jpg", "huge-dataset.json"]
}
```

Then load only what you need:

```ts
// Load only needed assets
await epos.assets.load('large-image.jpg')
const url = epos.assets.url('large-image.jpg')
```

### Lite JavaScript

Use `lite:` prefix for scripts that don't need full extension context:

```json
{
  "targets": [
    {
      "matches": ["*://example.com/*"],
      "load": [
        "lite:injected.js", // Minimal context
        "content.js" // Full context
      ]
    }
  ]
}
```

### Shadow CSS

Use `shadow:` prefix for CSS that runs in shadow DOM (isolated from page styles):

```json
{
  "targets": [
    {
      "matches": ["*://example.com/*"],
      "load": [
        "web.js",
        "shadow:isolated.css" // Won't conflict with page CSS
      ]
    }
  ]
}
```

## Validation Rules

Epos validates your `epos.json` and provides helpful error messages:

- ✅ `name` is required and 2-45 characters
- ✅ `slug` must be lowercase with letters, numbers, and hyphens
- ✅ `version` must be semantic (e.g., `1.0.0`)
- ✅ `description` max 132 characters
- ✅ `popup.width` between 150-800px
- ✅ `popup.height` between 150-572px
- ✅ `permissions` must be valid permission strings
- ✅ `targets` must have valid matches and load files
- ✅ File paths cannot go outside project with `..`

## IDE Support

Most IDEs support JSON schema validation. You can add this at the top of your file:

```json
{
  "$schema": "https://epos.dev/epos.schema.json",
  "name": "My Extension"
}
```

This provides autocomplete and validation in VS Code and other modern editors.

::: tip
When you save `epos.json`, Epos automatically regenerates your extension. Changes to `config`, `targets`, and `permissions` are instant!
:::
