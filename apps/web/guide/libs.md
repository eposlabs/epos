# Libs

Epos uses a number of third-party libraries to provide features and simplify development. This page lists the main libraries used in Epos, along with links to their documentation.

These libraries are already bundled with Epos, so you don't need to install them separately. When bundling your project with Vite, make sure to use `epos` plugin:

```
npm install -D epos
```

```
import { epos } from 'epos/vite'

{
  plugins: [epos()]
}
```

This plugin is required so you can safely import the used libraries and plugin will make sure to use the bundled versions instead of installing them separately which can lead to unwanted issues.

For example, when epos plugin is used, imports from 'react' will be resolved to the bundled version of React that comes with Epos, ensuring compatibility and preventing issues that can arise from having multiple versions of React in the same project.

Just import as usual:

```ts
import { useState } from 'react'
```

Epos plugin with transform it to:

```ts
const { useState } = epos.libs.react
```

All libraries are available under `epos.libs` object. You can access them directly, or use regular imports as shown above.

## List of Libraries

- `react`
- `react-dom`
- `react-dom/client`
- `react/jsx-runtime`
- `mobx`
- `mobx-react-lite`
- `yjs`
