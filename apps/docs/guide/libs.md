# Libs

Epos is built on top of several libraries, such as React and MobX.

They are exposed through `epos.libs`, and with the Epos Vite plugin you can import them normally.

## Available Libraries

Epos includes these libraries:

- `react` `19.2.4` - React.
- `react-dom` `19.2.4` - Base React DOM package.
- `react-dom/client` `19.2.4` - Client-side React DOM APIs.
- `react/jsx-runtime` `19.2.4` - React JSX runtime.
- `mobx` `6.15.0` - State management and reactivity.
- `mobx-react-lite` `4.1.1` - React bindings for MobX.
- `yjs` `13.6.30` - State synchronization.

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

As explained in the [Setup guide](/guide/setup), you should use the `epos/vite` plugin so Vite resolves these libraries to the built-in Epos versions instead of trying to load them from `node_modules`.

::: code-group

```ts {5} [vite.config.ts]
import { epos } from 'epos/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [epos()],
  ...
})
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
