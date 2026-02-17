---
outline: [2, 3]
---

<!-- TODO: add tailwindcss setup -->

# Vite Setup

In this tutorial, we will cover how to setup Epos project with **Vite, TypeScript, and React**.

::: info

You can skip this part all together and just use the default template from Epos interface.

For this, create new project and pick `Modern` template which setups **Vite + TypeScript + React + TailwindCSS**. This will create a project with all the necessary configuration for you. But if you want to understand how it works and how to setup everything yourself, read on.

:::

## Initialize Project

#### 1. Scaffold with Vite

Let's start by initializing our project using Vite's scaffolding tool. Run the following command in your terminal:

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
2. For variant, select what you prefer: **JavaScript** or **TypeScript**. We will use TypeScript in this tutorial, but you can use JavaScript if you want, just make sure to adjust file extensions and some configuration accordingly.
3. On the third step, it is highly recommened to use `rolldown-vite`. At the moment of writing (February 2026), `rolldown` is in RC state (release candidate), it will soon replace rollup in Vite 8. It has significantly better performance, so if you have a choice, select `rolldown-vite` as your bundler.

As you may know, Vite consist of two modes: server mode and build mode. In server mode, Vite serves your at localhost. In build mode, Vite bundles your code and generates files in the `dist` folder. Since Epos requires the actual code to be loaded, we cannot use Vite's dev server. We need actual bundled files. For this we will use Vite's build command instead of the dev server. It will create a production build of our code and output it to the `dist` folder.

#### 2. Create vite.config.ts

To configure this build mode, we need first create `vite.config.ts` with the following content:

::: code-group

```ts [vite.config.ts]
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  build: {
    // Rebuild on changes when developing
    watch: mode === 'production' ? null : {},

    rolldownOptions: {
      input: {
        // One entry point for now
        main: './src/main.tsx',
      },
      output: {
        // Provide static file names for output (normally Vite adds hashes)
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
}))
```

:::

Here we configured Vite to run in watch mode in development. Also we configured one entry point for our application - `src/main.tsx`. You can have multiple entry points if you want, just add them to the `input` object. We also configured the output file names to be the same as the entry point names, without hashes. This is important, because Epos needs to load specific files, and if the file names will contain hashes, we won't be able to predict them and tell Epos to load them.

#### 3. Create src/main.tsx

As we set `src/main.tsx` as our entry point. First, remove all files in `src` directory and create `main.tsx` inside:

<!-- prettier-ignore -->
```js
src/
  counter.ts // [!code --]
  main.ts // [!code --]
  style.css // [!code --]
  typescript.svg // [!code --]
  main.tsx // [!code ++]
```

Then add some code to main.tsx:

::: code-group

```tsx [src/main.tsx]
console.log('Hello from Epos!')
```

:::

#### 4. Update package.json

Then, update scripts in `package.json`, to always run `build` command, but in different modes:

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

This configuration allows us to use Vite as a bundler and generate files in the `dist` folder. You can run `npm run dev` and see that Vite will generate output files in the `dist` folder and watch for changes. When you change your code, Vite will automatically rebuild it and update the files in the `dist` folder.

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

::: TODO

Do not provide React example, provide simple .innerHTML rendering. react example will be covered in Rendering section.

:::

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
