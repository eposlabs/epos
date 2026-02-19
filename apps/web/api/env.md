# epos.env.\*

The `epos.env.*` provides information about the current execution context.

- [epos.env.tabId](#epos-env-tabid)
- [epos.env.windowId](#epos-env-windowid)
- [epos.env.isPopup](#epos-env-ispopup)
- [epos.env.isSidePanel](#epos-env-issidepanel)
- [epos.env.isBackground](#epos-env-isbackground)
- [epos.env.project](#epos-env-project)

## epos.env.tabId

The identifier of the current tab. `-1` for the `<background>` context and inside iframes.

```ts
epos.env.tabId: number | -1
```

#### Example

```ts
const tabInfo = await epos.browser.tabs.get(epos.env.tabId)
```

## epos.env.windowId

The identifier of the current window. `-1` for the `<background>` context and inside iframes.

```ts
epos.env.windowId: number | -1
```

#### Example

```ts
const windowInfo = await epos.browser.windows.get(epos.env.windowId)
```

## epos.env.isPopup

Indicates if the code is running in the `<popup>` context.

```ts
epos.env.isPopup: boolean
```

#### Example

```ts
if (epos.env.isPopup) {
  console.log('Running in popup')
}
```

## epos.env.isSidePanel

Indicates if the code is running in the `<sidePanel>` context.

```ts
epos.env.isSidePanel: boolean
```

#### Example

```ts
if (epos.env.isSidePanel) {
  console.log('Running in side panel')
}
```

## epos.env.isBackground

Indicates if the code is running in the `<background>` context.

```ts
epos.env.isBackground: boolean
```

#### Example

```ts
if (epos.env.isBackground) {
  console.log('Running in background')
}
```

## epos.env.project

Information about the currently running project.

```ts
epos.env.project: {
  id: string // Unique project identifier
  debug: boolean // Whether the project is in debug mode
  enabled: boolean // Whether the project is enabled
  spec: Spec // Normalized project specification from `epos.json`
  manifest: Manifest // The resulting `manifest.json` used for export
}
```

#### Example

```ts
console.log('Project:', epos.env.project)

if (epos.env.project.debug) {
  console.log('Running in debug mode')
}
```

<!-- ## Context Detection Pattern

A common pattern is to detect the execution context and run appropriate initialization:

```ts
// Initialize based on context
if (epos.env.isBackground) {
  // Background service worker initialization
  initializeBackground()
} else if (epos.env.isPopup) {
  // Popup initialization
  epos.render(<PopupApp />)
} else if (epos.env.isSidePanel) {
  // Side panel initialization
  epos.render(<SidePanelApp />)
} else {
  // Content script on web page
  injectUI()
}
``` -->
