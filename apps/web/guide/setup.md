# Setup

This guide shows how to set up Epos with Vite, TypeScript, and Tailwind CSS.

You can skip this guide and just select the `Vite + TypeScript + Tailwind CSS` template when creating a new project in the [app.epos.dev](https://app.epos.dev) dashboard. That sets up all the necessary configuration. If you want to understand how it works or customize the setup, read on.

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

Follow the prompts to set up the project:

1. **Project name:** Choose any name for your project.
2. **Framework:** Select **Vanilla**. Do not select React here, because Epos already provides it.
3. **Variant:** Choose your preference. This guide assumes you select **TypeScript**.

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

This package provides TypeScript types for the Epos API and includes the Epos Vite plugin.

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
    watch: mode === 'production' ? null : {},
    rolldownOptions: {
      input: {
        // Single entry point for now
        main: './src/main.tsx',
      },
      output: {
        // Avoid hashes in file names
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
}))
```

:::

As you may know, Vite consists of two major parts:

- A **dev server** that serves your application on `localhost`.
- A **build command** that bundles your code into static output.

Epos works with actual built files, so we need to use the **build command**.

## 5. Update `package.json`

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

This uses Vite as a bundler that writes files into `dist`.

## 6. Add `jsx` to `tsconfig.json`

Add the `jsx` option to `tsconfig.json` to enable JSX syntax:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx", // [!code ++]
    ...
  },
  "include": ["src"]
}
```

## 7. Create the Entry Files

Remove the files that Vite created for the starter app:

- `src/*`
- `public/*`
- `index.html`

Create `src/main.tsx` and `src/main.css`:

::: code-group

<!-- prettier-ignore -->
```tsx [src/main.tsx]
import 'epos'
import './main.css'

const App = () => {
  return (
    <div className="p-4 font-sans">
      Epos + Vite
    </div>
  )
}

epos.render(<App />)
```

```css [src/main.css]
@import 'tailwindcss';
```

:::

The `import 'epos'` line gives your editor types and autocomplete for the Epos API.

## 8. Create `epos.json`

Tell Epos to load the built files from `dist`.

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "targets": [
    {
      "matches": "<popup>",
      "load": ["dist/main.css", "dist/main.js"]
    }
  ]
}
```

:::

Notice that `epos.json` points to bundled `dist` files, not `src` files.

## 9. Start the Build

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

Vite rebuilds your project whenever you change source files, and Epos picks up the updated `dist` output.

## 10. Multiple Entry Points

If your project has more than one entry point, add them all to `input`:

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

Then load the corresponding built files in `epos.json`:

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

## 11. Shared Chunks and `vite-plugin-rebundle`

With multiple entry points, Vite may extract shared code into extra chunk files. That is normally ok, but Epos cannot load those chunks directly because they are imported dynamically.

To avoid that, you can use [`vite-plugin-rebundle`](https://www.npmjs.com/package/vite-plugin-rebundle), which keeps a single output file per entry point:

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

Notice that `minify` is disabled for the normal Vite output and enabled for `vite-plugin-rebundle`. This way the files are minified only once, during rebundling.
