# vite-plugin-rebundle

A Vite plugin that guarantees **one standalone file per entry point**. Each entry is bundled into a single file with no code-splitting or dynamic imports.

## Why?

Sometimes you need bundles without dynamic imports. Vite/Rollup don’t provide this option when building with multiple entries. `vite-plugin-rebundle` solves this issue by rebundling Vite’s output with rolldown to enforce single-file output. This plugin runs only during `vite build`, and it does not affect the Vite dev server.

## Installation

```bash
npm install -D vite-plugin-rebundle
```

## Usage

```javascript
import { defineConfig } from 'vite'
import { rebundle } from 'vite-plugin-rebundle'

export default defineConfig({
  plugins: [rebundle()],
  build: {
    rollupOptions: {
      input: {
        app: 'src/app.js',
        libs: 'src/libs.js',
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
})
```

## Options

You can provide rolldown options per entry point. This is useful, for example, to inject custom define variables into specific bundles:

```javascript
export default defineConfig({
  plugins: [
    rebundle({
      app: {
        output: {
          define: { BUNDLE_NAME: JSON.stringify('app') },
        },
      },
      libs: {
        input: {
          keepNames: true,
        },
        output: {
          define: { BUNDLE_NAME: JSON.stringify('libs') },
        },
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        app: 'src/app.js',
        libs: 'src/libs.js',
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
})
```

## How it works

When you run `vite build`, Rollup normally outputs multiple chunks per entry if code-splitting is needed.
`vite-plugin-rebundle` hooks into the build and **rebundles each entry’s output with rolldown**, forcing a single self-contained file per entry.

- Vite still handles the initial build (tree-shaking, asset pipeline, etc.).
- Afterward, each entry is passed through rolldown.
- The final result is one .js file per entry with no dynamic imports or shared chunks.
- Sourcemaps are ignored, as they would be inaccurate after rebundling.
