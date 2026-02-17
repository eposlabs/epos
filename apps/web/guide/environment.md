# Environment

Epos provides information about what project is currently running and in what context. This information is available via `epos.env` object:

```ts
epos.env.project // Information about your project
epos.env.tabId // Current tab ID (if applicable, -1 otherwise)
epos.env.windowId // Current window ID (if applicable, -1 otherwise)
epos.env.isPopup // true if running in popup context
epos.env.isSidePanel // true if running in side panel context
epos.env.isBackground // true if running in background context
```

All properties are typed with TypeScript, so you can get autocompletion and see what's inside. For more information, see full [Env API reference](/docs/api-env).
