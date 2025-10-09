# Libs

The **Libs API** exposes core libraries bundled with Epos, allowing you to use them directly without separate imports or dependency setup.  
All libraries are preloaded and version-aligned with the Epos runtime, ensuring compatibility and smaller bundle sizes for your project.

## `epos.libs.mobx`

[MobX](https://mobx.js.org/) — reactive state management library used internally by Epos.  
You can use it directly for fine-grained observability or custom reactions.

**Example**

```js
const { observable, autorun } = epos.libs.mobx

const user = observable({ name: 'Alice' })
autorun(() => console.log(user.name))
user.name = 'Bob'
```

## `epos.libs.mobxReactLite`

[mobx-react-lite](https://mobx.js.org/react-integration.html) — lightweight React bindings for MobX.
Epos uses it under the hood in [`epos.component`](#epos-component), but you can also import utilities like `observer` or `useLocalObservable`.

**Example**

```js
const { observer } = epos.libs.mobxReactLite
```

## `epos.libs.react`

[React](https://react.dev/) core library used by Epos.
Provides all standard React exports such as `useState`, `useEffect`, and `createElement`.

**Example**

```js
const { useState } = epos.libs.react
```

## `epos.libs.reactDom`

[react-dom](https://react.dev/reference/react-dom) — DOM rendering utilities for React.
Primarily used by `epos.render`.

**Example**

```js
const { createPortal } = epos.libs.reactDom
```

## `epos.libs.reactDomClient`

[react-dom/client](https://react.dev/reference/react-dom/client) — client-side rendering entry for React 18+.
Provides `createRoot` and related APIs.

**Example**

```js
const { createRoot } = epos.libs.reactDomClient
```

## `epos.libs.reactJsxRuntime`

The [React JSX runtime](https://react.dev/reference/react/jsx-runtime) — used internally by JSX transforms.
Normally you don’t need to access it directly unless writing low-level renderers or custom compilation logic.

## `epos.libs.yjs`

[Yjs](https://yjs.dev/) — CRDT-based real-time synchronization library.
Used internally by Epos for multi-context state synchronization, but you can use it directly for your own collaborative data structures.

**Example**

```js
const { Doc } = epos.libs.yjs
const doc = new Doc()
```

---

All libraries exposed under `epos.libs` are **read-only bindings** — their versions are managed by Epos to guarantee runtime compatibility.
