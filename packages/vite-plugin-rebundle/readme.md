# vite-plugin-rebundle

A Vite plugin that guarantees **one standalone file per entry point**. It rebundles each entry into a single file with no shared chunks or dynamic imports. Requires **Vite 8+**.

## Why?

Vite does not provide single-file output for multi-entry builds. When code splitting is needed, each entry can produce extra chunks and dynamic imports.

`vite-plugin-rebundle` solves that by taking Vite's build output and rebundling each entry with [`rolldown`](https://rolldown.rs/). It runs only during `vite build` and does not affect the dev server.

## Installation

```bash
npm install -D vite-plugin-rebundle
```

## Usage

Add the plugin to your Vite config:

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

`rebundle()` accepts up to two arguments:

- The first argument contains global `rolldown` input and output options applied to every entry.
- The second argument contains per-entry options that are deep-merged with the global ones.

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

When you run `vite build`, `vite-plugin-rebundle`:

1. Lets Vite perform the normal build.
2. Rebundles each entry with rolldown.
3. Writes back a single self-contained JavaScript file per entry.

## Watch Mode

When running in build watch mode, the plugin exposes `import.meta.env.REBUNDLE_PORT`. You can use it to listen for rebundle events over WebSocket:

```javascript
const ws = new WebSocket(`ws://localhost:${import.meta.env.REBUNDLE_PORT}`)
ws.addEventListener('message', e => console.log('Rebundle event:', e.data))
```

## Notes

Source maps are not currently supported. If you pass `sourcemap` option, it will be ignored.
