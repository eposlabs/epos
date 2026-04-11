---
name: epos-extension
description: 'Use when building, reviewing, or documenting Epos browser extensions; creating `epos.json`; wiring popup/background/page/frame targets; or generating code that uses `epos.browser`, `epos.bus`, `epos.state`, `epos.storage`, `epos.fetch`, `epos.frames`, or `epos.projects`.'
---

# Epos Extension Skill

Use this skill when the task is specifically about Epos extension development rather than generic browser-extension code.

## What Epos Is

Epos is an opinionated engine for building Chromium browser extensions with React.

- Epos itself is a browser extension.
- A project is connected as a local folder.
- Epos runs the built project in the browser during development.
- Epos exports a normal Manifest V3 extension bundle for publishing.

## Hard Constraints

Assume these are true unless the user explicitly says otherwise:

- React only.
- Chromium only.
- Manifest V3 only.
- No direct `chrome.*` usage in project code. Use `epos.browser.*`.
- No HMR. Development is rebuild plus reload.
- No source maps.
- `epos.json` is the main project config.
- `epos.json` points to built output files such as `dist/*.js` and `dist/*.css`, not `src/*` files.

## Default Stack To Generate

Unless the repository already uses something else:

- Vite
- TypeScript
- React function components
- Built assets in `dist`
- `import 'epos'` in runtime entry files

## Main Epos Primitives

Prefer these APIs over generic extension plumbing:

- `epos.render()` for UI entrypoints
- `epos.component()` for React components that observe EPOS state
- `epos.bus` for cross-context communication
- `epos.state` for shared reactive state with persistence and sync
- `epos.storage` for persistent non-reactive data and binary files
- `epos.fetch()` for cross-origin requests
- `epos.browser.*` instead of `chrome.*`
- `epos.frames` for hidden background iframes
- `epos.projects` only when `options.allowProjectsApi` is enabled

## `epos.json` Rules

The only required field is `name`.

Important fields:

- `name`
- `slug`
- `version`
- `description`
- `icon`
- `action`
- `popup`
- `options`
- `assets`
- `targets`
- `permissions`
- `optionalPermissions`
- `hostPermissions`
- `optionalHostPermissions`
- `manifest`

### Targets

Each target has:

- `matches`
- `load`

Common special matches:

- `<popup>`
- `<sidePanel>`
- `<background>`
- `<page>`

Common page matches:

- Standard match patterns such as `*://*.example.com/*`
- `frame:PATTERN`
- `exact:PATTERN`
- `<allUrls>`

### Load Prefixes

- `shadow:path.css` injects CSS into the Shadow DOM.
- `lite:path.js` loads JavaScript without the Epos runtime wrapper.

### `action`

- `true` emits the `:action` bus event when the toolbar icon is clicked.
- `'<page>'` opens the extension page target.
- `URL string` opens that URL.
- If a project has `<popup>` or `<sidePanel>`, `action` is ignored.

### Options

- `preloadAssets`
- `allowProjectsApi`
- `allowMissingModels`

Enable `epos.projects.*` only through `options.allowProjectsApi: true`.

## Code Generation Rules

When generating Epos code:

1. Start runtime entries with `import 'epos'`.
2. Use `epos.render(<App />)` for popup, page, and side-panel UIs.
3. Wrap state-reading React components with `epos.component()`.
4. Use `epos.state.connect()` for shared state and `epos.state.local()` for local reactive state.
5. Use `epos.bus.send()` for remote calls and `epos.bus.emit()` for same-context calls.
6. Use `epos.fetch()` for cross-origin requests when permissions are needed.
7. Use `epos.browser.*`, never raw `chrome.*`.
8. Declare the required permissions and host permissions in `epos.json`.
9. Point `epos.json` `load` fields to built `dist` assets.
10. Use `manifest` overrides only when `epos.json` does not express the needed behavior.

## Minimal Patterns

### Popup

```json
{
  "name": "My Extension",
  "targets": [
    {
      "matches": "<popup>",
      "load": ["dist/popup.css", "dist/popup.js"]
    }
  ]
}
```

### Background

```json
{
  "name": "My Extension",
  "targets": [
    {
      "matches": "<background>",
      "load": ["dist/background.js"]
    }
  ]
}
```

```ts
import 'epos'

epos.bus.on('ping', () => 'pong')
```

### Content/Page Injection

```json
{
  "name": "My Extension",
  "targets": [
    {
      "matches": "*://*.example.com/*",
      "load": ["dist/content.css", "dist/content.js"]
    }
  ]
}
```

### Basic UI Entry

```tsx
import 'epos'

const App = () => {
  return <div>Hello from Epos</div>
}

epos.render(<App />)
```

## Common Mistakes To Avoid

- Do not generate a manual `manifest.json` as the main configuration.
- Do not point `epos.json` at source files.
- Do not assume a localhost dev server is the runtime target.
- Do not use raw `chrome.*` APIs.
- Do not forget permissions required by `epos.browser` or `epos.fetch`.
- Do not use `epos.projects.*` unless explicitly enabled.

## Full Reference

For a longer Epos-specific context document, see:

- `apps/docs/guide/ai.md`

Use that file when a task needs the broader product explanation and the fuller API reference surface.
