<!-- TODO: add tailwindcss setup -->

::: danger

ERRROR: plugins inside build - not right

TODO: remove index.html

instead of
document.addEventListener('DOMContentLoaded', () => {})
use nothing? jus import 'main.css'

and then, when epos plugin added, use epos.render.

when epos.render is added, also add this:
"jsx": "react-jsx",
to tsconfig.json

minify: false in vite.config.ts and minify: mode !== 'devleopment' in rebundle!!
:::

# Vite Setup

In this section, we will setup Epos project with **Vite, TypeScript, React, and Tailwind CSS**.

::: tip

You can skip this part all together and just use a template from Epos interface.

For this, create new project and pick `Modern` template which setups **Vite + TypeScript + React + Tailwind**. This will create a project with all the necessary configuration for you. But if you want to understand how it works and how to setup everything yourself, read on.

:::

## 1. Scaffold with Vite

Let's start by initializing our project using the Vite scaffolding tool. Run the following command in your terminal:

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

```sh [deno]
deno init --npm vite
```

```sh [yarn]
yarn create vite
```

:::

Follow the prompts to configure your environment:

1. **Project name:** Choose any name. This will be the name of your project's folder.
2. **Framework:** Select **Vanilla**. Do not select React, because Epos already includes React. Selecting React will lead to unnecessary code.
3. **Variant:** Choose your preference. This guide uses **TypeScript**, but you can use **JavaScript** if you prefer — just remember to adjust file extensions and configurations accordingly.
4. **Use Vite 8:** Select **Yes**. It is highly recommended to use Vite 8, as it is powered by **Rolldown**, which bundles your code much faster than the previous **Rollup**-based versions of Vite.

## 2. Setup `vite.config.ts`

As you may know, Vite consists of two major parts:

- **A dev server** that serves your application under `localhost`.
- **A build command** that bundles your code into static output.

Since Epos needs to "inject" actual files into the browser, we cannot use Vite's dev server. Instead, we use the build command to generate files in the `dist` folder and tell Epos to load bundled results from there.

To set this up, create a `vite.config.ts` file in your project root with the following content:

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
        // Provide consistent file names for output (normally Vite adds hashes)
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
}))
```

:::

## 3. Update `package.json`

Now, we need to update the scripts inside your `package.json`. Since we are not using Vite's dev server, we'll replace the default `vite` command with `vite build`:

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

## 4. Install Tailwind CSS

You can skip this step if you prefer not to use Tailwind CSS, but the rest of the Epos documentation assumes it's available. Setting up Tailwind for an Epos project is just like any other Vite project:

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

```sh [deno]
deno add --dev npm:tailwindcss npm:@tailwindcss/vite
```

```sh [yarn]
yarn add -D tailwindcss @tailwindcss/vite
```

:::

Next, add the Tailwind plugin to your `vite.config.ts`:

::: code-group

```ts [vite.config.ts]
import tailwindcss from '@tailwindcss/vite' // [!code ++]
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  build: {
    plugins: [tailwindcss()], // [!code ++]
    watch: mode === 'production' ? null : {},
    rolldownOptions: {
      input: {
        main: './src/main.tsx',
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

## 5. Add Code

Now it's time to add some code. First, go ahead and remove all the boilerplate files from the `src` directory to give us a clean slate. Then, create two new files: `main.tsx` and `main.css`.

Your folder structure should now look like this:

<!-- prettier-ignore -->
```js
src/
  counter.ts // [!code --]
  main.ts // [!code --]
  style.css // [!code --]
  typescript.svg // [!code --]
  main.css // [!code ++]
  main.tsx // [!code ++]
```

Since we are using Tailwind, we need to import it in our CSS. Add the following content to `main.css`:

```css
@import 'tailwindcss';
```

Next, let's add some simple logic to `main.tsx` to render content on the page:

```tsx
import './main.css'

document.addEventListener('DOMContentLoaded', () => {
  document.body.innerHTML = `
    <div class="p-2 font-sans">
      Hello from Epos!
    </div>
  `
})
```

## 6. Install Epos

Now, install the `epos` package from NPM. It’s important to note that this package isn't the engine itself; instead, it provides the TypeScript definitions for the Epos API and includes a specialized plugin for Vite.

This plugin is essential because it tells Vite not to bundle libraries like `react` or `react-dom`. Since these are already provided by the Epos runtime, the plugin ensures your project uses those existing copies and doesn't include extra copies in your bundle.

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

```sh [deno]
deno add npm:epos
```

```sh [yarn]
yarn add epos
```

:::

Add Epos plugin to `vite.config.ts`:

```ts [vite.config.ts]
import tailwindcss from '@tailwindcss/vite'
import { epos } from 'epos/vite' // [!code ++]
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  build: {
    plugins: [
      epos(), // [!code ++]
      tailwindcss(),
    ],
    watch: mode === 'production' ? null : {},
    rolldownOptions: {
      input: {
        main: './src/main.tsx',
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
}))
```

To get full IntelliSense and type checking for the Epos API, you just need to import the package once in your entry file. Update your `main.tsx` like this:

::: code-group

```tsx [src/main.tsx]
import 'epos' // [!code ++]
import './main.css'

document.addEventListener('DOMContentLoaded', () => {
  document.body.innerHTML = `
    <div class="p-2 font-sans">
      Hello from Epos!
    </div>
  `
})
```

:::

## 7. Create `epos.json`

Create `epos.json` in the root project directory with the following content:

::: code-group

```json [epos.json]
{
  "name": "My Extension",
  "matches": "<popup>",
  "load": "dist/main.js"
}
```

Here we configured Vite to run in watch mode in development. Also we configured one entry point for our application - `src/main.tsx`. You can have multiple entry points if you want, just add them to the `input` object. We also configured the output file names to be the same as the entry point names, without hashes. This is important, because Epos needs to load specific files, and if the file names will contain hashes, we won't be able to predict them and tell Epos to load them.

#### 3. Create src/main.tsx

As we set `src/main.tsx` as our entry point. First, remove all files in `src` directory and create `main.tsx` inside:

This configuration allows us to use Vite as a bundler and generate files in the `dist` folder. You can run `npm run dev` and see that Vite will generate output files in the `dist` folder and watch for changes. When you change your code, Vite will automatically rebuild it and update the files in the `dist` folder.

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

## 8. Launch the Project

You're all set! Now, open your terminal and run `npm run dev` (or the equivalent command for your package manager). This will start Vite in **Watch Mode**. Every time you save a change, Vite will instantly regenerate the `dist/main.js` and `dist/main.css` files.

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

## 9. Multiple Entry Points

Let's say our project has several entry points, for example, we need `background.ts` for background script. To add this, we just need to add a new input in `vite.config.ts`:

```ts [vite.config.ts]
// some code here
```

Now let's create `src/background.ts` file:

```ts [src/background.ts]
console.log('Hello from background script!')
```

Running `npm run dev` with this setup will work just fine, we will get `dist/main.js` and `dist/background.js` generated. As expected.

But what if `main.ts` and `background.ts` will share some code? For example, we want to use some utility functions in both of them. In this case, we can create a new file `src/utils.ts` and put shared code there:

::: code-group

```ts [src/utils.ts]
export const greet = (name: string) => {
  return `Hello, ${name}!`
}
```

```ts [src/main.tsx]
import { greet } from './utils'
console.log(greet('Main'))
```

```ts [src/background.ts]
import { greet } from './utils'
console.log(greet('Background'))
```

:::

Now running `npm run dev` will still work, we will get a new file `dist/utils-<hash>.js` which is imported by `dist/main.js` and `dist/background.js`. This is because Vite automatically extracts shared code into separate chunks. However, this is a problem for us, because Epos cannot load dynamic modules, it requires bundled files.

Unfortunately, Vite does not provide out-of-the-box solution for this problem. They have this feature in their roadmap, but for now we need to use a workaround. For this, install `vite-plugin-rebundle` plugin and add it to `vite.config.ts`:

::: code-group

```sh [npm]
npm install -D vite-plugin-rebundle
```

```ts [vite.config.ts]
import { defineConfig } from 'vite'
import { epos } from 'epos/vite'
import { rebundle } from 'vite-plugin-rebundle' // [!code ++]
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  build: {
    plugins: [
      epos(),
      rebundle(), // [!code ++]
      tailwindcss(),
    ],
    watch: mode === 'production' ? null : {},
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

This plugin was build by me, the author of Epos, and the source code is available in the Epos mono repository. It works by rebundling the output files after Vite finishes bundling. Yes, it means we have more bundling steps, but since `rolldown` is extremly fast, it should not be a real problem and work just fine as a workaround until Vite provides a native solution for this problem.

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

---

Congratulation! You have successfully set up your Epos project with Vite. Now you can start developing your extension using all the features of Vite, such as fast bundling, hot module replacement, and more.

You can get the same setup by creating a new project in Epos interface and picking `Modern` template which includes Vite, TypeScript, React, and Tailwind.

Now, as we are ready to start real development with Epos, let's see how to use Epos APIs to render our app and interact with the page. We will cover this in the next section.
