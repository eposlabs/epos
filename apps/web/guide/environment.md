# Environment

To access information about currently executing environment and your project, you can use `epos.env` API. This API is available in all contexts (content script, background, popup, side panel) and provides useful information about the current execution context.

## Context Information

Epos provides information about what project is currently running and in what context. This information is available via `epos.env` object:

#### `epos.env.tabId`

Current tab ID if applicable, `-1` otherwise.

Can be used for [`epos.browser.tabs`](https://developer.chrome.com/docs/extensions/reference/api/tabs) API calls.

#### `epos.env.windowId`

Current window ID if applicable, `-1` otherwise.

Can be used for [`epos.browser.windows`](https://developer.chrome.com/docs/extensions/reference/api/windows) API calls.

#### `epos.env.isPopup`

`true` if the code is running in a popup context (`<popup>` in `epos.json`)

#### `epos.env.isSidePanel`

`true` if the code is running in a side panel context (`<sidePanel>` in `epos.json`)

#### `epos.env.isBackground`

`true` if the code is running in a background context (`<background>` in `epos.json`)

## Project Information

- `epos.env.project` - Information about your project
- `epos.env.tabId` - Current tab ID (if applicable, -1 otherwise)
- `epos.env.windowId` - Current window ID (if applicable, -1 otherwise)
- `epos.env.isPopup` - true if running in `<popup>`
- `epos.env.isSidePanel` - true if running in `<sidePanel>`
- `epos.env.isBackground` - true if running in `<background>`

All properties are typed with TypeScript, so you can get autocompletion and see what's inside.

## Project Information

`epos.env.project` provides information about the currently running project. It has the following properties:

- `epos.env.project.id` - Unique identifier of the project
- `epos.env.project.debug` - true if the project is running in debug mode
- `epos.env.project.enabled` - true if the project is enabled (can become false if the project is disabled via [app.epos.dev](https://app.epos.dev) dashboard
- `epos.env.project.spec` - this is normalized content of your `epos.json` file.
- `epos.env.project.manifest` - The manifest object generated from the project specification
