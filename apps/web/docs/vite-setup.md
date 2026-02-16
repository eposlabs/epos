---
outline: [2, 3]
---

<!-- TODO: add tailwindcss setup -->

# Vite Setup

In this tutorial, we will cover how to setup Epos project with **Vite, TypeScript, and React**.

Actually you can skip this part all together and just use the default template from Epos interface. For this, create new project and select Vite+React+TypeScript+TailwindCSS template. This will create a project with all the necessary configuration for you. But if you want to understand how it works and how to setup everything yourself, read on.

## Build

We will use Vite for building as this is de-factor standard bundler in the frontend ecosystem. But since Epos requires the actual code to be loaded, we cannot use Vite's dev server which serves modules from memory. We need actual bundled files. For this we will use Vite's build command instead of the dev server. It will create a production build of our code and output it to the `dist` folder.

Let's initialize project with Vite:

::: code-group

```sh [npm]
npm create vite@latest
```

```sh [yarn]
yarn create vite
```

```sh [pnpm]
pnpm create vite
```

```sh [bun]
bun create vite
```

```sh [deno]
deno init --npm vite
```

:::

Then follow the prompts.

1. For framework, select **Vanilla** as Epos already contains React and you don't need two React copies.
2. For variant, select what you prefer: JavaScript or TypeScript
3. On the third step, it is highly recommened to use `rolldown-vite`. At the moment of writing (February 2026), `rolldown` is in RC state (release candidate), it will soon replace rollup in Vite 8. It has significantly better performance, so if you have a choice, select `rolldown-vite` as your bundler.

First, after finishing with Vite initialization, open your project in your code editor and create `vite.config.ts` file with the following content:

::: code-group

```ts [vite.config.ts]
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  build: {
    watch: mode === 'production' ? null : {},
    rolldownOptions: {
      input: {
        app: './src/app.tsx',
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
}))
```

Here we configured Vite to run in watch mode in development. Also we configured one entry point for our application - `src/app.tsx`. You can have multiple entry points if you want, just add them to the `input` object. We also configured the output file names to be the same as the entry point names, without hashes. This is important, because Epos needs to load specific files, and if the file names will contain hashes, we won't be able to predict them and tell Epos to load them.

:::

Then, update scripts in `package.json`:

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

This setup allows us to use Vite as bundler and generate files in the `dist` folder.

Now install `epos` package from NPM. This package no the engine itself, but only TypeScript definitions for the epos API and also it includes plugin for vite. This plugin is necessary to ensure that every imports from 'react', 'react-dom' and other libraries that are already provided by Epos are not bundled again and they will use the existing copies from Epos runtime. You can see the full list of provided libraries in the [Libs API](https://docs.epos.dev/guide/epos-api#libraries) section of the documentation.

::: code-group

```sh [npm]
npm install epos
```

```sh [yarn]
yarn add epos
```

```sh [pnpm]
pnpm add epos
```

```sh [bun]
bun add epos
```

```sh [deno]
deno add npm:epos
```

:::

Now add `epos` plugin inside `vite.config.ts`:

::: code-group

```ts [vite.config.ts]
import { defineConfig } from 'vite'
import { epos } from 'epos/vite' // [!code ++]

export default defineConfig(({ mode }) => ({
  build: {
    plugins: [epos()], // [!code ++]
    watch: mode === 'production' ? null : {},
    rolldownOptions: {
      input: {
        app: './src/app.tsx',
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
}))
```

:::

## SRC

Now let's create `src/app.tsx` that we use as entry point for our application in vite.config.ts. Vite precreated some files in src directory, but we do not need them, so delete all src files and create app.tsx:

<!-- prettier-ignore -->
```js
src/
  counter.ts // [!code --]
  main.ts // [!code --]
  style.css // [!code --]
  typescript.svg // [!code --]
  app.tsx // [!code ++]
```

Inside app.tsx, add the following code:

::: code-group

```tsx [src/app.tsx]
import { createRoot } from 'react-dom/client'

const App = () => {
  return <div>Epos Extension</div>
}

// Create root element for React to render into
const div = document.createElement('div')
document.body.append(div)

// Render the app
const root = createRoot(div)
root.render(<App />)
```

:::

And now the final step, create `epos.json` in the root project directory:

::: code-group

```json [epos.json]
{
  "name": "My Epos Extension",
  "matches": "<popup>",
  "load": "dist/app.js"
}
```

:::

See how we specified for epos to load the bundled `dist/app.js`, not `src/app.tsx`. This is important, because as I mentioned before, Epos cannot load modules from memory, it needs actual files. So we need to bundle our code and output it to the `dist` folder, and then tell Epos to load the bundled file.

Now start the build in development mode:

::: code-group

```sh [npm]
npm run dev
```

```sh [yarn]
yarn dev
```

```sh [pnpm]
pnpm dev
```

```sh [bun]
bun dev
```

```sh [deno]
deno run dev
```

:::

I assume you already have epos engine istalled and running, if not, please see the [getting started guide](./basics) for instructions on how to do that.

Open `app.epos.dev`, create new project and link this project to your directory.

Now clicking Epos extension icon will open popup with "Epos Extension" text.

## Adding Targets

background
