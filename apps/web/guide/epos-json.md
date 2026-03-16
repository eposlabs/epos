# epos.json

`epos.json` is the main configuration file for every Epos project. It tells Epos how your extension should work.

You do not need to provide a standard extension `manifest.json` file. Epos generates it automatically from `epos.json`.

## Smallest Valid File

The only required field in `epos.json` is `name`. Everything else is optional.

```json
{
  "name": "My Extension"
}
```

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
  "permissions": ["notifications"],
  "optionalPermissions": ["downloads"],
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
  ]
}
```

## `name`

This is the extension name shown to users.

```json
{
  "name": "My Extension"
}
```

## `slug`

A lowercase dashed string shown in Epos system logs and frame names. If you do not provide it, Epos generates it from `name`: `My Extension` → `my-extension`. Use only lowercase letters, numbers, and hyphens.

```json
{
  "slug": "my-extension"
}
```

This is useful when your extension name is too long and you want a shorter identifier.

## `version`

The extension version in semver format. If you do not provide it, Epos uses `0.0.1`.

```json
{
  "version": "1.2.3"
}
```

## `description`

A short extension description. This is shown to users in the extension store.

```json
{
  "description": "Saves selected text into a personal library."
}
```

## `icon`

Path to your icon file. If you do not provide one, Epos logo will be used.

```json
{
  "icon": "dist/icon.png"
}
```

## `action`

`action` controls what happens when the extension icon is clicked.

```json
{
  "action": true
}
```

With `true`, Epos sends an `:action` bus event that you can listen to with `epos.bus.on(':action', ...)`.

You can also provide a URL, which opens in a new tab when the icon is clicked:

```json
{
  "action": "https://example.com/help"
}
```

If your project has a `<popup>` or `<sidePanel>` target, `action` is ignored.

## `popup`

`popup` lets you adjust the popup size.

```json
{
  "popup": {
    "width": 400,
    "height": 560
  }
}
```

This only matters when your project actually uses a popup. By default, Epos uses a vertical `380x572` popup.

## `options`

`options` contains a few engine-level settings.

```json
{
  "options": {
    "preloadAssets": true,
    "allowMissingModels": false,
    "allowProjectsApi": false
  }
}
```

### `options.preloadAssets`

Default: `true`.

If `true`, all provided assets are loaded automatically at startup. If `false`, you load them manually with `epos.assets.load()`.

### `options.allowMissingModels`

Default: `false`. Prevents Epos from throwing an error when your state contains a model instance but the related model class is not registered.

This is an advanced option. Use it only if you are sure you need it.

### `options.allowProjectsApi`

Default: `false`. Enables the [`epos.projects.*`](/api/projects) API.

This API lets a project manage other projects inside Epos. For example, `app.epos.dev` itself is just a project that uses this API and ships with Epos extension.

Most extensions do not need this API, so it is disabled by default.

## `assets`

List of static files bundled with your extension and available through `epos.assets`.

```json
{
  "assets": ["dist/logo.svg", "static/data.json"]
}
```

## Loading Code

The main fields for configuring where your code runs are `matches`, `load`, and `targets`.

If your project has only one target, you can use top-level `matches` and `load`.

```json {3-4}
{
  "name": "My Extension",
  "matches": "*://*.example.com/*",
  "load": ["dist/main.js", "dist/main.css"]
}
```

Epos treats this as shorthand for a single item in `targets`.

## `targets`

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

Each target has only two fields: `matches` and `load`.

## `matches`

`matches` accepts one string or an array of strings.

It describes where the code should load. You can use special Epos contexts or normal [match patterns](https://developer.chrome.com/docs/extensions/mv3/match_patterns/) for web pages.

### Special Epos Contexts

There are three special contexts:

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

For web pages, use standard extension match patterns.

```json
{
  "matches": "*://*.example.com/*"
}
```

You can also use:

- `<allUrls>` for all URLs
- `frame:PATTERN` for matching iframes
- `exact:PATTERN` for exact match

By default, Epos ignores query parameters when matching URLs. For example, if your match pattern is `https://example.com`, the code will also be injected into `https://example.com?foo=1`.

If you want to disable this behavior and match exactly what you wrote, prefix the pattern with `exact:`:

```json
{
  "matches": "exact:https://example.com"
}
```

## `load`

`load` is a list of JavaScript and CSS files to load into matching contexts.

<!-- prettier-ignore -->
```json
{
  "load": [
    "dist/global.css",
    "dist/global.js",
    "dist/main.css",
    "dist/main.js"
  ]
}
```

Order is preserved within each file type. In the example above, `global.css` loads before `main.css`, and `global.js` loads before `main.js`.

### Load Prefixes

Epos supports two useful prefixes:

`shadow:` loads CSS into the Shadow DOM.

<!-- prettier-ignore -->
```json {3}
{
  "load": [
    "shadow:dist/main.css",
    "dist/main.js"
  ]
}
```

`lite:` loads JavaScript as-is, without the Epos runtime.

<!-- prettier-ignore -->
```json {3}
{
  "load": [
    "lite:dist/patch.js",
    "dist/main.js"
  ]
}
```

Read more about `lite:` prefix in the [Basics guide](/guide/basics#lite-mode-for-javascript).

## Permission Fields

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

Learn more about permissions in the [Permissions guide](/guide/permissions).

## `manifest`

`manifest` lets you override or extend parts of the generated `manifest.json`.

```json
{
  "manifest": {
    "homepage_url": "https://example.com"
  }
}
```

You can provide an object that is merged into the Epos-generated `manifest.json`. If the same field exists in both places, your `manifest` value wins.

For example, if `epos.json` contains `description` and `manifest` also contains `description`, the value from `manifest` is used in the final file.

In most cases, you do not need this field. Epos already generates a valid `manifest.json` from the other fields in `epos.json`.

Use it only when you need to set manifest fields that Epos does not support directly in `epos.json`.

## Paths

Epos normalizes all paths in `epos.json`.

These are treated as the same path:

- `dist/main.js`
- `./dist/main.js`
- `/dist/main.js`

Out-of-root-directory paths such as `../somewhere/file.js` are not allowed.

## Camel Case Only

Standard `manifest.json` uses snake_case field names, but Epos uses camelCase in `epos.json` to stay consistent with JavaScript conventions:

- `hostPermissions` instead of `host_permissions`
- `optionalPermissions` instead of `optional_permissions`
- `optionalHostPermissions` instead of `optional_host_permissions`
- `<allUrls>` instead of `<all_urls>`
