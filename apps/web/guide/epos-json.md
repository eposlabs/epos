# epos.json

`epos.json` is the main configuration file for an Epos project. It tells Epos what your extension is called, where your code should run, what assets to bundle, and what permissions to request.

If you know `manifest.json`, you can think of `epos.json` as the higher-level source that Epos uses to generate the manifest for export.

## Smallest Valid File

The only required field is `name`.

```json
{
  "name": "My Extension"
}
```

That is enough to create a valid project, but it does not load any code yet.

## A Common Real Example

Here is a more typical configuration:

```json
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "version": "1.0.0",
  "description": "Example Epos extension",
  "icon": "dist/icon.svg",
  "assets": ["dist/data.json"],
  "targets": [
    {
      "matches": "<popup>",
      "load": ["dist/popup.js", "dist/popup.css"]
    },
    {
      "matches": "*://*.example.com/*",
      "load": ["dist/main.js", "shadow:dist/main.css"]
    },
    {
      "matches": "<background>",
      "load": ["dist/background.js"]
    }
  ],
  "permissions": ["notifications"],
  "optionalPermissions": ["downloads"],
  "hostPermissions": ["https://api.example.com/*"]
}
```

## Top-Level Fields

These are the main fields you will use most often.

### `name`

Required. This is the display name of the extension.

```json
{
  "name": "My Extension"
}
```

### `slug`

Optional. A stable internal identifier. If omitted, Epos generates it from `name`.

```json
{
  "slug": "my-extension"
}
```

Keep it lowercase and use only letters, numbers, and hyphens.

### `version`

Optional. If omitted, Epos uses `0.0.1`.

```json
{
  "version": "1.2.3"
}
```

For published projects, you should set this explicitly.

### `description`

Optional. A short extension description.

```json
{
  "description": "Saves selected text into a personal library"
}
```

### `icon`

Optional. Path to your icon file.

```json
{
  "icon": "dist/icon.png"
}
```

Epos automatically includes the icon in the exported bundle and also treats it as an asset.

## Loading Code

The most important fields for runtime behavior are `matches`, `load`, and `targets`.

### Single-Target Shorthand

If your project has only one target, you can use top-level `matches` and `load`.

```json
{
  "name": "My Extension",
  "matches": "*://*.example.com/*",
  "load": ["dist/main.js", "dist/main.css"]
}
```

Epos treats this as a shorthand for one item in `targets`.

### `targets`

For anything beyond the simplest setup, use `targets`.

```json
{
  "name": "My Extension",
  "targets": [
    {
      "matches": "<popup>",
      "load": ["dist/popup.js", "dist/popup.css"]
    },
    {
      "matches": "<background>",
      "load": ["dist/background.js"]
    },
    {
      "matches": "*://*.example.com/*",
      "load": ["dist/main.js", "shadow:dist/main.css"]
    }
  ]
}
```

Each target has two main fields:

- `matches` says where the target runs.
- `load` says which files should be loaded there.

## `matches`

`matches` accepts one string or an array of strings.

### Special Epos Contexts

These are the most common special values:

- `<popup>`
- `<sidePanel>`
- `<background>`

Example:

```json
{
  "matches": ["<popup>", "<background>"]
}
```

### URL Match Patterns

For web pages, use normal extension-style match patterns.

```json
{
  "matches": "*://*.example.com/*"
}
```

You can also use:

- `frame:*://*.example.com/*` for iframes only
- `exact:https://example.com/path` for exact matching
- `<allUrls>` for all URLs

In `epos.json`, use `<allUrls>` with a capital `U`, not raw manifest `<all_urls>`.

## `load`

`load` is a list of JavaScript and CSS files.

```json
{
  "load": ["dist/main.js", "dist/main.css"]
}
```

Order matters. Files are loaded in the order you list them.

### Load Prefixes

Epos supports two useful prefixes.

`shadow:` loads CSS into the Shadow DOM:

```json
{
  "load": ["dist/main.js", "shadow:dist/main.css"]
}
```

`lite:` loads lightweight JavaScript:

```json
{
  "load": ["lite:dist/snippet.js"]
}
```

Use `shadow:` when you want style isolation on web pages. Use `lite:` only when you specifically need its lightweight injection behavior.

## `action`

`action` controls what happens when the extension icon is clicked, but only when there is no popup or side panel target.

```json
{
  "action": true
}
```

With `true`, Epos sends a `:action` bus event.

You can also provide a URL:

```json
{
  "action": "https://example.com/help"
}
```

If your project has a `<popup>` or `<sidePanel>` target, `action` is ignored.

## `popup`

`popup` lets you adjust popup size.

```json
{
  "popup": {
    "width": 400,
    "height": 560
  }
}
```

This only matters when your project actually uses a popup.

## `options`

`options` contains a few engine-level flags.

```json
{
  "options": {
    "preloadAssets": true,
    "allowProjectsApi": false,
    "allowMissingModels": false
  }
}
```

### `options.preloadAssets`

If `true`, assets are loaded automatically at startup.
If `false`, you load them manually with `epos.assets.load()`.

### `options.allowProjectsApi`

Enables `epos.projects.*` inside the project.

Most projects do not need this.

### `options.allowMissingModels`

Relaxes model registration rules for state.

This is an advanced option and most projects should leave it off.

## `assets`

List any static files your project needs at runtime.

```json
{
  "assets": ["dist/logo.svg", "dist/data.json"]
}
```

You can then access them through `epos.assets`.

## Permissions Fields

Epos uses four permission-related fields:

- `permissions`
- `optionalPermissions`
- `hostPermissions`
- `optionalHostPermissions`

Example:

```json
{
  "permissions": ["notifications"],
  "optionalPermissions": ["downloads"],
  "hostPermissions": ["https://api.example.com/*"],
  "optionalHostPermissions": ["https://*.another.com/*"]
}
```

Host permissions are also derived automatically from `targets.matches`, so you often need fewer manual entries than you would in a handwritten manifest.

## `manifest`

`manifest` lets you override or extend parts of the generated manifest.

```json
{
  "manifest": {
    "homepage_url": "https://example.com"
  }
}
```

Use this only when the normal Epos fields are not enough.

Epos still preserves the engine permissions it needs internally.

## Paths

Epos normalizes paths in `epos.json`.

These are treated as the same path:

- `dist/main.js`
- `./dist/main.js`
- `/dist/main.js`

External paths such as `../somewhere/file.js` are not allowed.

## Camel Case Only

In `epos.json`, use Epos field names, not raw manifest names.

Use:

- `optionalPermissions`
- `hostPermissions`
- `optionalHostPermissions`

Do not use:

- `optional_permissions`
- `host_permissions`
- `optional_host_permissions`

The same idea applies to `<allUrls>` instead of `<all_urls>`.

## A Good Workflow

For most projects, this is enough:

1. Start with `name`.
2. Add one target with `matches` and `load`.
3. Move to `targets` when you need popup, background, or multiple page contexts.
4. Add `assets`, `permissions`, and `options` only when the project actually needs them.

That usually keeps `epos.json` small and easy to understand.
