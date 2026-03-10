# Environment

`epos.env` gives you information about where your code is running and which project it belongs to.

This is useful when the same code can run in different places, such as the popup, background, side panel, or a web page.

## Basic Context Flags

The most common values are these three boolean flags:

- `epos.env.isPopup`
- `epos.env.isSidePanel`
- `epos.env.isBackground`

Example:

```ts
if (epos.env.isBackground) {
  console.log('Running in background')
}

if (epos.env.isPopup) {
  console.log('Running in popup')
}
```

These checks are often enough when you need slightly different startup logic in different contexts.

## `tabId` and `windowId`

`epos.env.tabId` and `epos.env.windowId` tell you which browser tab and window the current code belongs to.

```ts
console.log(epos.env.tabId)
console.log(epos.env.windowId)
```

You can use them with the `epos.browser.tabs` and `epos.browser.windows` APIs:

```ts
const tab = await epos.browser.tabs.get(epos.env.tabId)
const win = await epos.browser.windows.get(epos.env.windowId)
```

For background code and iframes, these values are `-1`.

## Project Information

`epos.env.project` contains information about the current project:

- `id` - the internal project ID
- `debug` - whether the project is running in debug mode
- `enabled` - whether the project is enabled
- `spec` - the normalized `epos.json`
- `manifest` - the generated `manifest.json` content used for export

Example:

```ts
console.log(epos.env.project.id)
console.log(epos.env.project.spec.name)

if (epos.env.project.debug) {
  console.log('Debug mode is on')
}
```

`spec` is useful when your code needs to read its own `epos.json` configuration. `manifest` is mostly useful for inspection and debugging.
