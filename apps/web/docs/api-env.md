---
outline: [2, 3]
---

# Env API

The environment API provides information about the current execution context, including tab and window identifiers, context type, and project information.

## epos.env.tabId

The identifier of the current tab. Returns `-1` for background context and iframes.

```ts
epos.env.tabId: number | -1
```

#### Example

```ts
if (epos.env.tabId !== -1) {
  console.log('Running in tab:', epos.env.tabId)
} else {
  console.log('Running in background or iframe')
}
```

## epos.env.windowId

The identifier of the current window. Returns `-1` for background context and iframes.

```ts
epos.env.windowId: number | -1
```

#### Example

```ts
if (epos.env.windowId !== -1) {
  console.log('Running in window:', epos.env.windowId)
}
```

## epos.env.isPopup

Indicates if the code is running in the popup context.

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

Indicates if the code is running in the side panel context.

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

Indicates if the code is running in the background service worker context.

```ts
epos.env.isBackground: boolean
```

#### Example

```ts
if (epos.env.isBackground) {
  console.log('Running in background')
  // Initialize background tasks
}
```

## epos.env.project

Information about the current project.

```ts
epos.env.project: {
  id: string
  debug: boolean
  enabled: boolean
  spec: Spec
  manifest: Manifest
}
```

#### Properties

- `id` - Unique project identifier
- `debug` - Whether the project is in debug mode
- `enabled` - Whether the project is enabled
- `spec` - The project's Epos specification from `epos.json`
- `manifest` - The generated Chrome extension manifest

#### Example

```ts
console.log('Project name:', epos.env.project.spec.name)
console.log('Project version:', epos.env.project.spec.version)
console.log('Debug mode:', epos.env.project.debug)

// Conditional behavior based on debug mode
if (epos.env.project.debug) {
  console.log('Running in debug mode')
}
```

## Context Detection Pattern

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
```
