::: warning

This is AI-generated draft based on Epos source code. Proper documentation is coming soon.

:::

# API

This section documents the runtime API available through the global `epos` object.

The pages are grouped by namespace:

- [epos.\*](/api/general) — top-level APIs such as fetch, browser, render, and component.
- [epos.env.\*](/api/env) — information about the current context and project.
- [epos.dom.\*](/api/dom) — DOM nodes created by Epos for the current project.
- [epos.bus.\*](/api/bus) — messaging, signals, RPC helpers, and namespaced buses.
- [epos.state.\*](/api/state) — shared state, local state, models, and lifecycle symbols.
- [epos.storage.\*](/api/storage) — persistent key-value storage.
- [epos.assets.\*](/api/assets) — access to assets declared in `epos.json`.
- [epos.frames.\*](/api/frames) — background frames created by the project.
- [epos.projects.\*](/api/projects) — project management APIs.
- [epos.libs.\*](/api/libs) — runtime copies of the libraries bundled with Epos.

## Notes

- The signatures in these docs follow the public Epos types.
- When behavior is not obvious from the types, the notes here are based on the engine implementation.
- `epos.browser` is a wrapper around a supported subset of `chrome.*`, not a full replacement for the entire Chrome Extensions API.
