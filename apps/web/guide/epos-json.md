# epos.json

`epos.json` is the main configuration file for any Epos project. It tells Epos how your extension should work.

You do not need to provide standard extension `manifest.json` file, Epos generates `manifest.json` automatically based on your `epos.json` config.

## Smallest Valid File

The only required field in `epos.json` is `name`, all other fields are optional.

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

This is the name of the extension that appears to users.

```json
{
  "name": "My Extension"
}
```

## `slug`

A lowercased dashed string that shown in Epos system logs. If not provided, Epos will generate it from the `name` field: `My Extension` → `my-extension`. Keep it lowercase and use only letters, numbers, and hyphens.

```json
{
  "slug": "my-extension"
}
```

This is useful, when your extension name is too long and you want a shorter identifier for logs.

## `version`

Version of your extension in semver format. If not provided, `0.0.1` will be used.

```json
{
  "version": "1.2.3"
}
```

## `description`

A short extension description. This will be shown to users in the extension store.

```json
{
  "description": "Saves selected text into a personal library"
}
```

## `icon`

Path to your icon file. If not provided, Epos logo will be used.

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

With `true`, Epos sends a `:action` bus event that you can listen with `epos.bus.on(':action', ...)`.

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

Default: `true`.

If `true`, assets are loaded automatically at startup.
If `false`, you load them manually with `epos.assets.load()`.

### `options.allowProjectsApi`

Default: `false`. Enables `epos.projects.*` inside the project.

This is an API for dynamically managing projects inside Epos. In fact, `app.epos.dev` is just a project that uses this API and ships with Epos pre-installed.

Most projects do not need this API, so it is disabled by default.

### `options.allowMissingModels`

Default: `false`. Does not throw an error if your states contains model instances but does not have the related model class registered.

This is an advanced option, use it only if you sure you need it.

## `assets`

List of static files that will be bundled with your extension and available through `epos.assets`.

```json
{
  "assets": ["dist/logo.svg", "static/data.json"]
}
```

## Loading Code

The fields that configure where your code should be executed are `matches`, `load`, and `targets`.

If your project has only one target, you can use top-level `matches` and `load`.

```json
{
  "name": "My Extension",
  "matches": "*://*.example.com/*",
  "load": ["dist/main.js", "dist/main.css"]
}
```

Epos treats this as a shorthand for one item in `targets`.

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

Each target has two fields: `matches` and `load`.

## `matches`

`matches` accepts one string or an array of strings.

It describes where the code should be loaded. You can pass special Epos contexts or normal [match patterns](https://developer.chrome.com/docs/extensions/mv3/match_patterns/) for web pages.

### Special Epos Contexts

These are 3 special contexts:

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

- `<allUrls>` for all URLs
- `frame:PATTERN` for matching iframes
- `exact:PATTERN` for exact match

By default Epos allows any GET parameters in the match pattern. For example, if your match pattern is `https://example.com`, the code will injected into `https://example.com?foo=1` as well.

If you want to disable this behavior, and match the exact pattern you provided, prefix the pattern with `exact:`:

```json
{
  "matches": "exact:https://example.com"
}
```

## `load`

`load` is a list of JavaScript and CSS files that should be loaded into the matching contexts.

<!-- prettier-ignore -->
```json
{
  "load": [
    "dist/global.css",
    "dist/main.css",
    "dist/global.js",
    "dist/main.js"
  ]
}
```

Order between the same type of files is preserved. So in the example above, `global.css` is loaded before `main.css`, and `global.js` is loaded before `main.js`.

### Load Prefixes

Epos supports two useful prefixes.

1. `shadow:` loads CSS into the Shadow DOM:

```json
{
  "load": ["dist/main.js", "shadow:dist/main.css"]
}
```

2. `lite:` loads JavaScript as is, without any Epos runtime.

```json
{
  "load": ["lite:dist/patch.js"]
}
```

Epos always tries to inject your code as soon as possible, but it does not guarantee that your code will be executed before the page's own scripts.

If you need to ensure that your code runs first, use `lite:` prefix. In this mode, Epos does not do any extra processing with your code, does not inject its APIs and uses another injection strategy that ensures that your code runs _before_ the page's own scripts.

This can be useful if you need to override some global functions or do something before the page's own code runs.

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
