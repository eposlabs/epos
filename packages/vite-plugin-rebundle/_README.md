# vite-plugin-rebundle

A Vite plugin that guarantees **one standalone file per entry point**. Each entry is bundled into a single file with no code-splitting or dynamic imports.

## Why?

There are cases when you need bundles without dynamic imports. Vite doesn't provide such an option when building with multiple entries. `vite-plugin-rebundle` solves this issue by rebundling Vite’s output with [`rolldown`](https://rolldown.rs/) to enforce single-file output. This plugin runs only during `vite build`, and it does not affect the Vite dev server.

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
        bundle1: 'src/bundle1.js',
        bundle2: 'src/bundle2.js',
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
})
```

## Configuration

You can provide global `rolldown` input and output options as the first argument. Per-entry options can be passed in the second argument:

```javascript
export default defineConfig({
  plugins: [
    rebundle(
      // Global options applied to all bundles
      {
        input: {...},
        output: {...},
      },
      // Per-entry options, will be deep-merged with global options
      {
        bundle1: {
          input: {...},
          output: {...},
        },
        bundle2: {
          input: {...},
          output: {...},
        },
      },
    ),
  ],
  build: {
    rollupOptions: {
      input: {
        bundle1: 'src/bundle1.js',
        bundle2: 'src/bundle2.js',
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
})
```

## How it works

When you run `vite build`, Vite normally outputs multiple chunks per entry if code-splitting is needed.
`vite-plugin-rebundle` hooks into the build process and **rebundles each entry’s output with rolldown**, forcing a single self-contained file per entry.

- Vite still handles the initial build (tree-shaking, asset pipeline, etc.).
- Afterward, each entry is passed through rolldown.
- The final result is one js file per entry with no dynamic imports or shared chunks.

## Notes

Source maps are not currently supported. If you pass `sourcemap` option, it will be ignored. This plugin works with both `vite` and `rolldown-vite`.
