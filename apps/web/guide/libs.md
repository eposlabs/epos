# Libs

Epos is built on top of several libraries, such as React and MobX.

They are exposed through `epos.libs`, and with the Epos Vite plugin you can import them normally.

This guide explains which libraries are available and how to use them. For exact API details, see the [Libraries API Reference](/api/libs).

## Available Libraries

Epos includes these libraries:

- `react` - React.
- `react-dom` - Base React DOM package.
- `react-dom/client` - Client-side React DOM APIs.
- `react/jsx-runtime` - React JSX runtime.
- `mobx` - State management and reactivity.
- `mobx-react-lite` - React bindings for MobX.
- `yjs` - State synchronization.

All of them are included in the exported extension. You do not need to install them separately.

## Accessing Libraries

All built-in libraries are exposed through `epos.libs`. For example, to use React:

```ts
const { useState } = epos.libs.react
```

Library names are converted to camelCase, so `react/jsx-runtime` becomes `epos.libs.reactJsxRuntime`:

```ts
const { jsx } = epos.libs.reactJsxRuntime
```

## Setting Up Vite

As explained in the [Vite guide](/guide/vite), you should use the `epos/vite` plugin so Vite resolves these libraries to the built-in Epos versions instead of trying to load them from `node_modules`.

::: code-group

```ts [vite.config.ts]
import { epos } from 'epos/vite'

export default {
  plugins: [epos()],
}
```

:::

This plugin lets you import the libraries as usual:

```ts
import { useState } from 'react'
```

Under the hood, those imports are transformed to:

```ts
const { useState } = epos.libs.react
```

So in most cases, you do not need to use `epos.libs` directly. You can import these libraries normally, and the Vite plugin handles the rest.
