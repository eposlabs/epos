# Vite Setup

This guide shows how to setup Epos with Vite, TypeScript, React, and Tailwind CSS.

You can skip this guide and just select `Vite` template when creating a new project in the dashboard. This will setup all the steps below for you. But if you want to understand how it works or customize the setup, read on.

## 1. Create a Vite Project

First, scaffold a fresh project with Vite:

::: code-group

```sh [npm]
npm create vite@latest
```

```sh [pnpm]
pnpm create vite
```

```sh [bun]
bun create vite
```

```sh [yarn]
yarn create vite
```

:::

Follow the prompts to configure your environment:

1. **Project name:** Choose any name for your project.
2. **Framework:** Select **Vanilla**. Do not select React, Epos already includes React.
3. **Variant:** Choose your preference. This guide assumes you select **TypeScript**.
4. **Use Vite 8**: Select **Yes**. Vite 8 uses [`rolldown`](https://rolldown.rs/) for bundling which is significantly faster.

## 2. Install Epos

Install the `epos` package:

::: code-group

```sh [npm]
npm install epos
```

```sh [pnpm]
pnpm add epos
```

```sh [bun]
bun add epos
```

```sh [yarn]
yarn add epos
```

:::

This package provides TypeScript types for Epos API and the Epos Vite plugin.

## 3. Install Tailwind CSS

Install Tailwind CSS and its Vite plugin:

::: code-group

```sh [npm]
npm install -D tailwindcss @tailwindcss/vite
```

```sh [pnpm]
pnpm add -D tailwindcss @tailwindcss/vite
```

```sh [bun]
bun add -D tailwindcss @tailwindcss/vite
```

```sh [yarn]
yarn add -D tailwindcss @tailwindcss/vite
```

:::

## 4. Create `vite.config.ts`

Start with this config:

::: code-group

```ts [vite.config.ts]
import tailwindcss from '@tailwindcss/vite'
import { epos } from 'epos/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [epos(), tailwindcss()],
  build: {
    // Rebuild on changes when developing
    watch: mode === 'production' ? null : {},

    rolldownOptions: {
      input: {
        // One entry point for now
        main: './src/main.tsx',
      },
      output: {
        // Use consistent file names for output
        // (normally Vite adds hashes)
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
}))
```

:::

As you may know, Vite consists of two major parts:

- A **dev server** that serves your application under `localhost`.
- A **build command** that bundles your code into static output.

Epos works with actual built files, so we need to use the **build command**. The `watch` option makes Vite rebuild whenever you change source files.

## 4. Update `package.json`

Update to use the build command:

::: code-group

```json [package.json]
{
  ...
  "scripts": {
    "dev": "vite --mode development", // [!code --]
    "build": "tsc && vite build", // [!code --]
    "preview": "vite preview" // [!code --]
    "dev": "vite build --mode development", // [!code ++]
    "build": "vite build --mode production", // [!code ++]
    "preview": "vite build --mode preview" // [!code ++]
  },
  ...
}
```

:::

This way you use Vite as a bundler that writes files into `dist`.

## 5. Create the Entry Files

Remove precreated Vite example files:

- `src/counter.ts`
- `src/main.ts`
- `src/style.css`
- `src/typescript.svg`
- `index.html`

Create `src/main.tsx` and `src/main.css`:

::: code-group

<!-- prettier-ignore -->
```tsx [src/main.tsx]
import 'epos'
import './main.css'

const App = () => {
  return (
    <div className="rounded-sm bg-gray-200 p-2">
      Hello from Epos + Vite
    </div>
  )
}

epos.render(<App />)
```

```css [src/main.css]
@import 'tailwindcss';
```

:::

The `import 'epos'` line gives you types and editor help for the Epos API.

## 6. Create `epos.json`

Tell Epos to load the built files from `dist`.

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "matches": "<popup>",
  "load": ["dist/main.css", "dist/main.js"]
}
```

:::

Notice that `epos.json` points to bundled `dist` files, not `src` files.

## 7. Start the Build

Run the development build:

::: code-group

```sh [npm]
npm run dev
```

```sh [pnpm]
pnpm dev
```

```sh [bun]
bun dev
```

```sh [yarn]
yarn dev
```

:::

Vite now rebuilds whenever you change source files, and Epos picks up the new `dist` output.

## 9. Multiple Entry Points

If your project has more than one entry, add them all to `input`:

::: code-group

```ts [vite.config.ts]
rolldownOptions: {
  input: {
    main: './src/main.tsx',
    background: './src/background.ts', // [!code ++]
  },
}
```

:::

Then load the matching built files in `epos.json`:

```json
"targets": [
  {
    "matches": "<popup>",
    "load": ["dist/main.css", "dist/main.js"]
  },
  // [!code ++]
  {
    // [!code ++]
    "matches": "<background>",
    // [!code ++]
    "load": ["dist/background.js"]
    // [!code ++]
  }
]
```

## 10. Shared Chunks and `vite-plugin-rebundle`

With multiple entry points, Vite may extract shared code into extra chunk files. That is normally good, but Epos can't load those chunks as they are imported dynamically.

To avoid chunk files, you can use [`vite-plugin-rebundle`](https://www.npmjs.com/package/vite-plugin-rebundle) which ensures single output file per entry point:

::: code-group

```sh [npm]
npm install -D vite-plugin-rebundle
```

```sh [pnpm]
pnpm add -D vite-plugin-rebundle
```

```sh [bun]
bun add -D vite-plugin-rebundle
```

```sh [yarn]
yarn add -D vite-plugin-rebundle
```

:::

Update `vite.config.ts`:

```ts
import tailwindcss from '@tailwindcss/vite'
import { epos } from 'epos/vite'
import { defineConfig } from 'vite'
import { rebundle } from 'vite-plugin-rebundle' // [!code ++]

export default defineConfig(({ mode }) => ({
  plugins: [
    epos(),
    tailwindcss(),
    // [!code ++]
    rebundle({
      // [!code ++]
      output: {
        minify: mode !== 'development', // [!code ++]
      }, // [!code ++]
    }), // [!code ++]
  ],
  build: {
    watch: mode === 'production' ? null : {},
    minify: false, // [!code ++]
    rolldownOptions: {
      input: {
        main: './src/main.tsx',
        background: './src/background.ts',
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
}))
```

Notice how we disabled `minify` for usual Vite output and enabled it for `vite-plugin-rebundle`. This way your files are minified only once, when rebundled.

## Summary

The main idea of using Vite with Epos is simple:

1. Use Vite to write built files into `dist`.
2. Point `epos.json` at those built files.
3. Run `vite build --mode development` while you work.
