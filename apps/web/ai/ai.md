# AI Reference

This file is written as a single context document for LLMs that need to understand how to build extensions with Epos.

## What Epos Is

Epos is an opinionated engine for building Chromium browser extensions with React.

The engine itself is a browser extension. You connect a local folder to it, Epos runs your project directly in the browser during development, and when the project is ready Epos exports a standard Manifest V3 extension bundle.

Epos is not a generic extension framework. It intentionally narrows the stack to make extension development simpler.

## Core Constraints

When generating Epos code, assume all of the following are true:

- React only.
- Chromium only.
- Manifest V3 only.
- No direct `chrome.*` access in project code. Use `epos.browser.*` instead.
- No HMR. Development uses rebuild + reload.
- No source maps.
- `epos.json` is the project config. Epos generates `manifest.json` from it.
- Epos works with built output files such as `dist/*.js` and `dist/*.css`, not raw source files.

## Mental Model

An Epos project usually has these parts:

1. Source files written with React, TypeScript, CSS, and a bundler such as Vite.
2. A build step that writes bundled files into `dist`.
3. An `epos.json` file that tells Epos which built files to load and where to load them.
4. Runtime code that uses the global `epos` API.

Typical workflow:

1. Install the Epos engine from the Chrome Web Store.
2. Connect a local project folder.
3. Run the local build in watch mode.
4. Let Epos load the generated `dist` files into popup, background, pages, side panel, or frames.
5. Export a standalone ZIP when ready to publish.

## What LLMs Should Assume By Default

When asked to generate Epos code, prefer these defaults unless the user says otherwise:

- Use Vite as the bundler.
- Use TypeScript.
- Use React function components.
- Put build outputs in `dist`.
- Import `epos` for types and global API availability.
- Call `epos.render()` from the main UI entry.
- Wrap React components that read Epos state with `epos.component()`.
- Use `epos.bus` for cross-context communication.
- Use `epos.state` for shared reactive state.
- Use `epos.storage` for persistent non-reactive data and binary files.
- Use `epos.fetch()` for cross-origin requests.
- Use `epos.browser.*` instead of `chrome.*`.

## Recommended Project Setup

Minimal package install:

```sh
npm install epos
npm install -D tailwindcss @tailwindcss/vite
```

Minimal `vite.config.ts`:

```ts
import tailwindcss from '@tailwindcss/vite'
import { epos } from 'epos/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [epos(), tailwindcss()],
  build: {
    watch: mode === 'production' ? null : {},
    rolldownOptions: {
      input: {
        main: './src/main.tsx',
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
}))
```

Recommended scripts:

```json
{
  "scripts": {
    "dev": "vite build --mode development",
    "build": "vite build --mode production",
    "preview": "vite build --mode preview"
  }
}
```

Minimal entry file:

```tsx
import 'epos'
import './main.css'

const App = () => {
  return <div>Hello from Epos</div>
}

epos.render(<App />)
```

Minimal `epos.json`:

```json
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "targets": [
    {
      "matches": "<popup>",
      "load": ["dist/main.css", "dist/main.js"]
    }
  ]
}
```

## `epos.json` Reference

`epos.json` is the main Epos project config. The only required field is `name`.

### Top-Level Fields

- `$schema: string`
- `name: string`
- `slug: string`
- `version: string`
- `description: string | null`
- `icon: string | null`
- `action: true | '<page>' | string | null`
- `popup: { width: number; height: number }`
- `options: { preloadAssets: boolean; allowProjectsApi: boolean; allowMissingModels: boolean }`
- `assets: string[]`
- `targets: Target[]`
- `permissions: Permission[]`
- `optionalPermissions: OptionalPermission[]`
- `hostPermissions: string[]`
- `optionalHostPermissions: string[]`
- `manifest: object | null`

### Important Semantics

- `slug` is optional. If omitted, Epos derives it from `name`.
- `version` defaults to `0.0.1`.
- `description` is limited to extension-store style short text.
- `icon` is automatically added to assets.
- `manifest` is merged into the generated manifest and wins on conflicts.
- Paths are normalized. `dist/main.js`, `./dist/main.js`, and `/dist/main.js` are treated the same.
- Out-of-root paths such as `../file.js` are not allowed.

### `action`

`action` controls what happens when the user clicks the extension toolbar icon.

- `true`: emit the special `:action` bus event.
- `'<page>'`: open the extension page target in a new tab.
- `URL string`: open that URL in a new tab.

If the project has a `<popup>` or `<sidePanel>` target, `action` is ignored.

### `popup`

Popup size defaults to approximately `380x572` and can be customized through:

```json
{
  "popup": {
    "width": 400,
    "height": 560
  }
}
```

### `options`

- `preloadAssets`: if `true`, assets are loaded automatically at startup.
- `allowProjectsApi`: if `true`, enables `epos.projects.*`.
- `allowMissingModels`: if `true`, state restore will not fail when a registered model is missing.

### `targets`

Each target has:

- `matches`
- `load`

You can also use top-level `matches` + `load` as shorthand for a single target.

### `matches`

Supported special contexts:

- `<page>`
- `<popup>`
- `<sidePanel>`
- `<background>`

Supported page matching patterns:

- Standard Chromium match patterns such as `*://*.example.com/*`
- `frame:PATTERN` for iframes
- `exact:PATTERN` for exact matching
- `<allUrls>`

### `load`

`load` is an ordered list of built JS and CSS resources.

Supported prefixes:

- `shadow:path.css`: inject CSS into the Shadow DOM.
- `lite:path.js`: load JS without the Epos runtime wrapper.

Example:

```json
{
  "targets": [
    {
      "matches": "*://*.example.com/*",
      "load": ["dist/global.css", "dist/main.js", "shadow:dist/content.css", "lite:dist/patch.js"]
    }
  ]
}
```

### Permissions Fields

Epos uses these fields:

- `permissions`
- `optionalPermissions`
- `hostPermissions`
- `optionalHostPermissions`

Supported permissions include:

- `alarms`
- `background`
- `browsingData`
- `contextMenus`
- `cookies`
- `declarativeNetRequest`
- `downloads.ui`
- `downloads`
- `notifications`
- `offscreen`
- `scripting`
- `sidePanel`
- `storage`
- `tabs`
- `unlimitedStorage`
- `webNavigation`

## Runtime Contexts

The same Epos project can run in multiple places:

- Popup
- Side panel
- Background
- Extension page
- Regular web pages
- Matching iframes

Use `epos.env` to detect where the current code is running.

## Full Epos Runtime API

The Epos runtime is exposed as the global `epos` object.

### Top-Level

```ts
epos.fetch(url: string | URL, init?: ReqInit): Promise<Res>
epos.browser: Browser
epos.render(node: React.ReactNode, container?: Container): void
epos.component<T>(Component: React.FC<T>): React.FC<T>
epos.env: EposEnv
epos.dom: EposDom
epos.bus: EposBus
epos.state: EposState
epos.storage: EposStorage
epos.assets: EposAssets
epos.frames: EposFrames
epos.projects: EposProjects
epos.libs: EposLibs
```

### `epos.fetch`

`epos.fetch()` is a `fetch`-like API that performs requests through the extension side so it can bypass normal page CORS restrictions.

Rules:

- It still requires host access through `matches`, `hostPermissions`, or `optionalHostPermissions`.
- Streaming is not supported.
- The response is Response-like, not a full native `Response`.

Supported response surface:

```ts
type Res = {
  ok: boolean
  url: string
  type: ResponseType
  status: number
  statusText: string
  redirected: boolean
  headers: Headers
  text(): Promise<string>
  json(): Promise<any>
  blob(): Promise<Blob>
}
```

### `epos.browser`

`epos.browser` is the Epos wrapper around a supported subset of `chrome.*`, but available from every Epos context, including web pages and iframes.

Supported namespaces:

- `action`
- `alarms`
- `browsingData`
- `contextMenus`
- `cookies`
- `declarativeNetRequest`
- `downloads`
- `extension`
- `i18n`
- `management`
- `notifications`
- `permissions`
- `runtime`
- `sidePanel`
- `storage`
- `tabs`
- `webNavigation`
- `windows`

Important differences from raw `chrome.*`:

- Use `epos.browser`, never `chrome`.
- Some unsupported or deprecated Chrome APIs are removed.
- `contextMenus.create()` returns a Promise with the final menu id.
- `permissions.contains()`, `getAll()`, `remove()`, and `request()` are Promise-based.
- `declarativeNetRequest.updateDynamicRules()` and `updateSessionRules()` auto-assign added rule ids and return the generated ids.
- `storage.local`, `storage.session`, and `storage.sync` are scoped to the current Epos project.

### `epos.render`

```ts
epos.render(node: React.ReactNode, container?: Container): void
```

Renders React UI into the Epos DOM. If no container is provided, Epos uses a default root prepared for the current target.

### `epos.component`

```ts
epos.component<T>(Component: React.FC<T>): React.FC<T>
```

Wraps a React component so it reacts to Epos observable state. Use this for components that read `epos.state.connect()` or `epos.state.local()` values.

### `epos.env`

```ts
type EposEnv = {
  tabId: -1 | number
  windowId: -1 | number
  isPopup: boolean
  isSidePanel: boolean
  isBackground: boolean
  project: Project
}
```

`project` contains runtime information about the current project:

- `id`
- `spec`
- `manifest`
- `enabled`
- `debug`
- `pageUrl`

### `epos.dom`

```ts
type EposDom = {
  root: HTMLDivElement
  view: HTMLDivElement
  shadowRoot: ShadowRoot
  shadowView: HTMLDivElement
}
```

These are the DOM nodes Epos creates for the current target.

### `epos.bus`

```ts
type EposBus = {
  on<T extends Fn>(name: string, callback: T, thisArg?: unknown): void
  off<T extends Fn>(name: string, callback?: T): void
  once<T extends Fn>(name: string, callback: T, thisArg?: unknown): void
  send<T>(name: string, ...args: FnArgsOrArr<T>): Promise<FnResultOrValue<T> | undefined>
  emit<T>(name: string, ...args: FnArgsOrArr<T>): Promise<FnResultOrValue<T> | undefined>
  setSignal(name: string, value?: unknown): void
  waitSignal<T>(name: string, timeout?: number): Promise<T | undefined>
  register(name: string, api: Record<string, any>): void
  unregister(name: string): void
  use<T extends Record<string, any>>(name: string): BusService<T>
  for(namespace: string): Omit<EposBus, 'for'> & { dispose(): void }
}
```

Behavior:

- `send()` calls remote listeners.
- `emit()` calls only local listeners.
- `setSignal()` and `waitSignal()` coordinate readiness.
- `register()` + `use()` provide lightweight RPC.
- `for(namespace)` creates a namespaced bus.

Special event:

- `:action` is emitted when `epos.json` uses `"action": true` and the toolbar icon is clicked.

### `epos.state`

```ts
type EposState = {
  connect: {
    <T>(initial?: Initial<T>, versioner?: Versioner<T>): Promise<T>
    <T>(name?: string, initial?: Initial<T>, versioner?: Versioner<T>): Promise<T>
  }
  disconnect(name?: string): void
  transaction(fn: () => void): void
  reaction: typeof mobx.reaction
  local<T extends {}>(initial?: Initial<T>): T
  list(filter?: { connected?: boolean }): Promise<{ name: string | null; connected: boolean }[]>
  remove(name?: string): Promise<void>
  register(models: Record<string, Ctor>): void
  PARENT: symbol
  ATTACH: symbol
  DETACH: symbol
}
```

Behavior:

- `connect()` returns a shared reactive state proxy.
- Shared state is synchronized across contexts and persisted in IndexedDB.
- Named states are supported.
- `transaction()` batches synchronous changes.
- `local()` creates reactive local state with no sync and no persistence.
- `register()` enables class-based state models.
- Version migrations are supported through the optional `versioner` argument.

### `epos.storage`

```ts
type EposStorage = {
  get: {
    <T>(key: string): Promise<T | null>
    <T>(name: string, key: string): Promise<T | null>
  }
  set: {
    <T>(key: string, value: T): Promise<void>
    <T>(name: string, key: string, value: T): Promise<void>
  }
  has: {
    (key: string): Promise<boolean>
    (name: string, key: string): Promise<boolean>
  }
  delete: {
    (key: string): Promise<void>
    (name: string, key: string): Promise<void>
  }
  keys(name?: string): Promise<string[]>
  list(): Promise<{ name: string | null }[]>
  clear(name?: string): Promise<void>
  for(name?: string): {
    get<T>(key: string): Promise<T | null>
    set(key: string, value: unknown): Promise<void>
    has(key: string): Promise<boolean>
    delete(key: string): Promise<void>
    keys(): Promise<string[]>
    clear(): Promise<void>
  }
}
```

Behavior:

- IndexedDB-backed key-value storage.
- Suitable for files, blobs, and large non-reactive data.
- Supports named storages.

### `epos.assets`

```ts
type EposAssets = {
  url(path: string): string
  get(path: string): Promise<Blob | null>
  list(filter?: { loaded?: boolean }): { path: string; loaded: boolean }[]
  load: {
    (): Promise<void>
    (path: string): Promise<void>
  }
  unload: {
    (): void
    (path: string): void
  }
}
```

Behavior:

- Exposes files listed in `epos.json` `assets`.
- `url()` returns a usable asset URL.
- `load()` optionally preloads assets into memory.

### `epos.frames`

```ts
type EposFrames = {
  create(url: string, attrs?: Record<string, string | number>): Promise<string>
  remove(id?: string): Promise<void>
  has(id?: string): Promise<boolean>
  list(): Promise<{ id: string; name: string; url: string }[]>
}
```

Behavior:

- Creates hidden background iframes in the offscreen document.
- Useful when a real page context is needed, not just a network request.
- Frame targets can also receive Epos code via `frame:` match patterns.

### `epos.projects`

```ts
type EposProjects = {
  has(id: string): Promise<boolean>
  get<T extends ProjectQuery>(id: string, query?: T): Promise<Project<T> | null>
  list<T extends ProjectQuery>(query?: T): Promise<Project<T>[]>
  create<T extends string>(params: Bundle & Partial<{ id: T } & ProjectSettings>): Promise<T>
  update(id: string, updates: Partial<Bundle & ProjectSettings>): Promise<void>
  remove(id: string): Promise<void>
  export(id: string): Promise<Record<string, Blob>>
  watch(listener: () => void): void
  fetch(url: string): Promise<Bundle>
}
```

Behavior:

- This API is available only when `options.allowProjectsApi` is enabled.
- It lets one Epos project manage other projects inside the engine.
- `fetch()` downloads an `epos.json` bundle plus referenced source and asset files.

### `epos.libs`

```ts
type EposLibs = {
  mobx: typeof mobx
  mobxReactLite: typeof mobxReactLite
  react: typeof react
  reactDom: typeof reactDom
  reactDomClient: typeof reactDomClient
  reactJsxRuntime: typeof reactJsxRuntime
  yjs: typeof yjs
}
```

These are the runtime library instances bundled with Epos.

## Practical Rules For Generating Epos Code

If an LLM needs to write Epos code, these defaults are usually correct:

1. Start every runtime entry with `import 'epos'`.
2. Use `epos.render(<App />)` for UI entrypoints.
3. Use `epos.component()` around components that read reactive state.
4. Use `epos.state.connect()` for shared state and `epos.state.local()` for unsynced local state.
5. Use `epos.bus.send()` for cross-context calls and `epos.bus.emit()` for same-context calls.
6. Use `epos.fetch()` for cross-origin requests instead of plain `fetch()` when host permissions are involved.
7. Use `epos.browser.*` instead of `chrome.*`.
8. Point `epos.json` `load` fields at built `dist` assets, not `src` files.
9. Prefer `targets` over ad hoc custom manifest wiring.
10. Reach for `manifest` overrides only when `epos.json` does not already express what is needed.

## Anti-Patterns

Avoid these mistakes when generating Epos code:

- Do not create or maintain a manual `manifest.json` as the primary config.
- Do not use raw `chrome.*` in extension code.
- Do not assume HMR or a dev server mounted at `localhost`.
- Do not point `epos.json` to source files.
- Do not use React without importing `epos` types or without the Epos runtime present.
- Do not forget to declare permissions or host permissions required by `epos.browser` or `epos.fetch` usage.
- Do not use `epos.projects.*` unless `options.allowProjectsApi` is enabled.

## Minimal Examples

### Popup

```json
{
  "name": "Popup Example",
  "targets": [
    {
      "matches": "<popup>",
      "load": ["dist/popup.css", "dist/popup.js"]
    }
  ]
}
```

### Background Listener

```json
{
  "name": "Background Example",
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

### Page Injection

```json
{
  "name": "Content Example",
  "targets": [
    {
      "matches": "*://*.example.com/*",
      "load": ["dist/content.css", "dist/content.js"]
    }
  ]
}
```

### Action Event

```json
{
  "name": "Action Example",
  "action": true,
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

epos.bus.on(':action', tab => {
  console.log('Toolbar icon clicked', tab)
})
```

## Summary

Epos is a React-first extension engine that replaces most of the usual browser-extension plumbing with a simpler `epos.json` config and a single global runtime API.

If an LLM understands these points, it can usually produce correct Epos code:

- Build source files into `dist`.
- Describe loading behavior in `epos.json`.
- Use the global `epos` runtime.
- Treat `epos.browser`, `epos.bus`, `epos.state`, `epos.storage`, and `epos.fetch` as the main primitives.
- Respect Epos constraints instead of writing generic Chrome-extension boilerplate.
