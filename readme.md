# ᛃ epos

Epos is an opinionated engine for building Chromium browser extensions with React.

The engine itself is a browser extension. You connect a local folder to it, and Epos runs your code directly in the browser. When you are ready, it exports a standard Manifest V3 extension bundle.

The goal is simple: less setup, fewer moving parts, and more high-level features built in from the start.

## Why Epos

- Zero-config workflow.
- React-first extension development.
- Built-in cross-context messaging.
- Shared state with persistence and synchronization.
- Key-value storage for files and data powered by IndexedDB.
- Extension APIs available in every context.
- Simpler project config through `epos.json`.

## How It Works

1. Install the Epos extension from the Chrome Web Store.
2. Open the Epos dashboard.
3. Connect a local folder.
4. Describe your project in `epos.json`.
5. Epos runs your code in the browser as you edit.
6. Export a standalone ZIP when the project is ready to publish.

This is a different workflow from the usual browser extension toolchain, but the output is still a normal browser extension.

## Example

```json
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "matches": "<popup>",
  "load": ["dist/main.css", "dist/main.js"]
}
```

```tsx
import 'epos'

const App = () => {
  return <div>Hello from Epos</div>
}

epos.render(<App />)
```

## Built-in APIs

Epos includes a high-level runtime API for common extension problems:

- `epos.bus` for messaging between contexts.
- `epos.state` for shared reactive state.
- `epos.storage` for persistent key-value storage and files.
- `epos.assets` for bundled static assets.
- `epos.browser` for supported `chrome.*` APIs in every context.
- `epos.fetch` for cross-origin requests through the extension.
- `epos.env` for context and project information.
- `epos.render` and `epos.component` for React rendering.

## Constraints

Epos is intentionally opinionated.

- React only.
- Chromium only.
- Manifest V3 only.
- Live reload instead of HMR.
- Some required permissions are always part of the exported manifest.

These trade-offs are what make the simpler workflow and built-in features possible.

## Documentation

- Docs: https://epos.dev
- Install: https://get.epos.dev
- Dashboard: https://app.epos.dev

Suggested starting points:

- Overview: `apps/web/guide/index.md`
- Basics: `apps/web/guide/basics.md`
- Features: `apps/web/guide/features.md`
- Vite setup: `apps/web/guide/vite.md`

## Monorepo Layout

- `apps/engine` - the core Epos extension engine.
- `apps/shell` - the Epos dashboard and shell UI.
- `apps/web` - the documentation website.
- `packages/epos` - the runtime package used in Epos projects.
- `packages/vite-plugin-rebundle` - the Vite plugin used for single-file output per entry.

## Development

Install dependencies:

```sh
npm install
```

Useful commands:

```sh
npm run lint
npm run prettier
```

Run the docs site:

```sh
npm run dev -w apps/web
```

Build the docs site:

```sh
npm run build -w apps/web
```

Build the engine app:

```sh
npm run build -w apps/engine
```

Build the shell app:

```sh
npm run build -w apps/shell
```

## License

MIT
