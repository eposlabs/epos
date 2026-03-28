::: warning

This is an AI-generated draft based on the Epos source code. Proper documentation is coming soon.

:::

# epos.env.\*

`epos.env` describes where the current code is running and which project owns it.

## epos.env.tabId

```ts
epos.env.tabId: -1 | number
```

The current tab id.

### Notes

- In `<background>` and iframe contexts, this is `-1`.
- In tab-bound contexts, this value can be passed to browser APIs such as `tabs.get()`.

### Example

```ts
if (epos.env.tabId !== -1) {
  const tab = await epos.browser.tabs.get(epos.env.tabId)
  console.log(tab.url)
}
```

## epos.env.windowId

```ts
epos.env.windowId: -1 | number
```

The current window id.

### Notes

- In `<background>` and iframe contexts, this is `-1`.

## epos.env.isPopup

```ts
epos.env.isPopup: boolean
```

`true` when the current context is `<popup>`.

## epos.env.isSidePanel

```ts
epos.env.isSidePanel: boolean
```

`true` when the current context is `<sidePanel>`.

## epos.env.isBackground

```ts
epos.env.isBackground: boolean
```

`true` when the current context is `<background>`.

## epos.env.project

```ts
epos.env.project: {
  id: string
  spec: Spec
  manifest: chrome.runtime.ManifestV3
  enabled: boolean
  debug: boolean
  pageUrl: string
}
```

Information about the current project.

### Fields

- `id` — the internal project id.
- `spec` — the normalized `epos.json` content.
- `manifest` — the generated Manifest V3 object used for export.
- `enabled` — whether the project is enabled.
- `debug` — whether the dev build of the engine is used, `true` by default.
- `pageUrl` — the URL of the `<page>` target.

### Example

```ts
console.log(epos.env.project.spec.name)
console.log(epos.env.project.manifest.version)
```
