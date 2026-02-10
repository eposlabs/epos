---
outline: [2, 3]
---

# Basics

::: danger TODO
first, https://example.com, then tell that you can use match pattern (link). So _://_.example.com/\* means "all pages on example.com".
:::

::: danger TODO
Call scripts on web pages content scripts, describe that epos does not provide 'isolated', explain that it has extension api available in the regular content scripts.
:::

In this section, we will cover the core principles of building extensions with Epos. To keep things as simple as possible, we will start with **plain JavaScript and CSS**. This allows you to see the engine in action without needing a build step.

Once you are comfortable with the basics, we will walk through how to [set up a development environment](/docs/vite-setup) using **Vite, TypeScript, and React**.

## Installation

First, install Epos from the [Chrome Web Store](https://get.epos.dev).

Once installed, Epos automatically opens [app.epos.dev](https://app.epos.dev) in a new tab. You can also open this page by clicking the Epos extension icon. This tab is automatically pinned, as it must stay open while you are developing your extension.

## Workflow

Epos uses a unique approach compared to other tools. Instead of a CLI-based workflow, Epos is a browser extension that runs your code and provides a dedicated interface for managing your projects, [app.epos.dev](https://app.epos.dev).

With Epos, you don't develop an extension in the usual sense; you create a project and run it directly within the engine. When your project is ready for production, simply click **EXPORT** in the Epos interface. This generates a ZIP file containing a standard extension, ready for submission to the Chrome Web Store or other marketplaces.

## Your First Project

Let's create a project and see how it works.

1. **Create a directory:** Start by creating an empty folder on your computer for your project.
2. **Create new project in Epos:** Go to [app.epos.dev](https://app.epos.dev) and click the **NEW PROJECT** button. This will create a new empty project inside the engine.
3. **Connect to Epos:** Now you need to connect your local directory with the Epos project. Click the **CONNECT** button in the top-right corner of the Epos interface. A file picker dialog will open; select the directory you created in step 1.

The browser will ask for your permission to access this folder. This is necessary for Epos to read your code and run it in the browser. Epos only accesses the files within this specific directory and cannot see any other files on your computer.

This workflow is powered by the [File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) — a modern browser feature that allows web applications to read and write files on your computer with your permission. Epos uses this API to create a live bridge between your project directory and the engine.

## epos.json

Open your project directory in your favorite code editor and create an `epos.json` file. This is the "heart" of every Epos project; it is where you define how the engine should run your code.

If you are familiar with `manifest.json` file in browser extensions, you can think of `epos.json` as a higher-level abstraction. Epos doesn't need a separate `manifest.json` file to run your project. Instead, the engine generates a valid manifest automatically during export based on your project settings.

`epos.json` has only one required field: `"name"`. Add the following content:

::: code-group

```json [epos.json]
{
  "name": "My Extension"
}
```

:::

You will notice this name is instantly picked up in the Epos interface. The engine reacts to any changes in your directory as they happen. Just keep [app.epos.dev](https://app.epos.dev) open while you work so the engine can maintain this direct access to your files.

## How to Load CSS

Right now, our project does nothing. Let’s change that by styling [example.com](https://example.com) website.

First, create a file named `example.css`:

::: code-group

```css [example.css]
body {
  background: gold;
}
```

:::

Next, tell Epos to apply this style to `example.com` by adding the `matches` and `load` fields to your `epos.json`:

TODO: explain that matches describes "where" your code should be run. And "load" describes "what" should be run.

::: code-group

```json [epos.json]
{
  "name": "My Epos Extension",
  "matches": "https://example.com", // [!code ++]
  "load": "example.css" // [!code ++]
}
```

:::

No reload or extra steps are required; Epos picks up the changes instantly. Open [example.com](https://example.com) in your browser to see the gold background!

## Live Reloading

By default, you can see changes by manually refreshing the page. If you want Epos to handle this for you, simply add `?autoreload` to the URL: `https://example.com/?autoreload`. Now, whenever you save changes to `example.css`, the page will reload automatically.

You can use this feature on any website where Epos is injecting code.

## Match Patterns

::: danger

TODO

:::

## How to Load JS

Changing styles is a great start, but let's add some logic. Create a file named `example.js` in your project directory (we'll stick to plain JavaScript for now to keep things build-step free):

::: code-group

TODO: use:

```
document.documentElement.innerHTML = `
  <div style="padding: 20px; font-family: sans-serif;">
    Hello from Epos extension!
  </div>
`
```

TODO: Also change exmaple.js -> main.js (and example.css -> main.css).

```js [example.js]
console.log('Hello from Epos extension!')
```

:::

Now, update the `load` field in `epos.json`. Since we are loading multiple files, we change the field to an array:

::: code-group

```json [epos.json]
{
  "name": "My Epos Extension",
  "matches": "*://*.example.com/*",
  "load": [
    "example.css",
    "example.js" // [!code ++]
  ]
}
```

:::

Open the DevTools console on `example.com` to see your message.

Congratulations — you’ve mastered the basics of Epos! The core philosophy is simple: you tell the engine what code to load and where to load it, and Epos handles the rest.

## Popup

What if you want to run code inside the extension popup instead of on a website? The principle remains the same: you just tell Epos what to **load**.

Create `popup.js`:

::: code-group

```js [popup.js]
document.body.innerHTML = `
  <div style="padding: 20px; font-family: sans-serif;">
    Hello from Epos Popup!
  </div>
`
```

:::

To load this in the popup, use the special `<popup>` keyword in the `matches` field:

::: code-group

```json [epos.json]
{
  "name": "My Epos Extension",
  "matches": "*://*.example.com/*", // [!code --]
  "load": ["example.css", "example.js"], // [!code --]
  "matches": "<popup>", // [!code ++]
  "load": "popup.js" // [!code ++]
}
```

:::

Now, clicking the Epos extension icon will display your popup. It's that simple. If you'd prefer to use the browser's side panel instead, just change `<popup>` to `<sidePanel>`.

## Working with Multiple Targets

By adding the popup logic above, we replaced our `example.com` functionality. To run both at the same time, we use **targets**. This allows you to define multiple independent environments within a single project.

Update your `epos.json` to use the `targets` array:

::: code-group

```json [epos.json]
{
  "name": "My Epos Extension",
  // [!code ++]
  "targets": [
    // [!code ++]
    {
      // [!code ++]
      "matches": "<popup>",
      // [!code ++]
      "load": "popup.js"
      // [!code ++]
    },
    // [!code ++]
    {
      // [!code ++]
      "matches": "*://*.example.com/*",
      // [!code ++]
      "load": ["example.css", "example.js"]
      // [!code ++]
    }
    // [!code ++]
  ]
}
```

:::

Voila! Now both your popup and your `example.com` scripts work simultaneously.

## Background

Sometimes you need logic to run continuously in the background. While typical extensions use a Service
Worker, Epos runs your project's background code inside an **offscreen iframe**.

#### Why not a Service Worker?

It is important to note that Epos _does_ use a Service Worker to run its own core logic. However, a Service Worker is a closed environment that cannot dynamically execute external code from your local project directory.

To allow you to run background logic without these restrictions, Epos uses an offscreen iframe. This approach may seem unconventional at first, but it actually provides several key advantages:

- **No API restrictions:** Service Workers cannot access document or other standard DOM APIs. With an offscreen iframe, you have access to the full Web API.
- **Independent reloading:** When you modify your background script, Epos reloads only that specific iframe. This prevents a full extension reload, meaning your other active contexts (like popups or content scripts) stay intact and do not lose their state.

#### Implementation

Create `background.js`:

::: code-group

```js [background.js]
console.log('Hello from Epos background!')

// You can use DOM APIs here!
const div = document.createElement('div')
```

:::

Then, add the `<background>` target to your `epos.json`:

::: code-group

```json [epos.json]
{
  "name": "My Epos Extension",
  "targets": [
    // [!code ++]
    {
      // [!code ++]
      "matches": "<background>",
      // [!code ++]
      "load": "background.js"
      // [!code ++]
    },
    {
      "matches": "<popup>",
      "load": "popup.js"
    },
    {
      "matches": "*://*.example.com/*",
      "load": ["example.css", "example.js"]
    }
  ]
}
```

:::

#### Debugging the Background

To get access to DevTools for the background iframe, follow these steps:

1. Go to `chrome://extensions`.
2. Click the `Details` button on the Epos extension card.
3. Locate the `Inspect views` section and click on `offscreen.html`. This will open the DevTools window where you can already see the logs from your background script.
4. To switch to your background context, select your project in the JavaScript Context dropdown (the "top" dropdown in the Console tab).

## TODO

Add icon + description + Export to see standalone ZIP

<!--

## Beyond the Basics

So far, we used Epos only as a code runner, but we haven't touched its powerful APIs. Let's explore them.

## Core Concepts & API

All Epos APIs are available under the global `epos` object. This isn't a true "global" object; it is injected into your code, so you can treat it as global, but it is scoped and not directly exposed to web pages.

### Bus Messaging

Epos provides a powerful messaging system called Bus (named for "Bus Event", not the vehicle) that simplifies communication between different extension contexts (popup, side panel, background, tabs). Unlike standard `chrome.runtime.sendMessage`, Epos Bus allows you to send messages seamlessly across all contexts without worrying about routing.

Let's see how it works:

```js
// In background.js
epos.bus.on('background', data => console.log('⬇︎ background:', data))

// In example.js
epos.bus.on('example', data => console.log('⬇︎ example:', data))

// In popup.js
document.body.innerHTML = `
  <div>
    <button id="bg">Send Message to Background</button>
    <button id="ex">Send Message to Example</button>
  </div>
`

document.querySelector('#bg').onclick = () => {
  epos.bus.send('background', 'Hello from Popup!')
}

document.querySelector('#ex').onclick = () => {
  epos.bus.send('example', 'Hello from Popup to Example!')
}
```

Now open the popup and click the buttons. You will see that messages are received in the background and `example.com` contexts respectively. Epos Bus automatically handles routing, so you don't need to worry about how to pass messages between different contexts. From popup to web page, from popup to background, from background to web page and so on — it just works.

If you need to return some data, it is also possible.

```js
// In background.js
epos.bus.on('getBgData', value => {
  return { value: 100 + value }
})

// In example.js
window.epos = epos // Expose epos to the console for testing
```

Now open DevTools console on `example.com` and type:

```js
const data = await epos.bus.send('getBgData', 10) // { value: 110 }
```

Bus supports all JSON-serializable data AND blobs. This is a huge benefit over standard messaging APIs which do not support binary data. With `epos.bus` you can easily send images, videos, and any other binary data between extension contexts.

Some other data types are also supported, see the [Bus API documentation](../api/bus.md) for details.

## Project Setup: TypeScript & React

We have covered the basics of Epos and its messaging system. Now let's set up TypeScript and React using Vite. You can use the default Vite setup, or initialize a project from the **Vite + React + TS** template in shell.epos.dev. Alternatively, you can catch up manually:

We will use Vite in build mode only, because Epos requires JS and CSS files to be physically present, while the Vite dev server serves files from localhost (which isn't compatible with Epos's injection mechanism).

1. Initialize a new npm project in your project directory:

```bash
npm init -y
```

2. Install Vite and TypeScript. It is highly recommended to install Vite 8 (or newer) as it uses Rolldown (a Rust-based bundler), which is significantly faster.

```bash
npm install --save-dev vite@8.beta typescript
```

3. Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "jsx": "react-jsx",
    "moduleResolution": "Node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "~/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

4. Create `vite.config.ts`:

```ts
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: 'popup.tsx',
        background: 'background.ts',
        example: 'example.tsx',
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
})
```

With these configuration files in place, you are ready to start building robust extensions with React and TypeScript!

To finish the setup, add a build script to your `package.json`:

```json
"scripts": {
  "build": "vite build --watch"
}
```

Now run `npm run build`. Vite will watch for changes and rebuild your files into the `dist` folder. Finally, update your `epos.json` to point to the compiled files in `dist/` (e.g., `dist/popup.js`, `dist/background.js`).

Happy coding!

## Is Epos Right for You?

If you are just starting with extension development, Epos is an excellent choice as it abstracts away much of the complexity. You only need to know the basics of JavaScript and React.

If you are an experienced extension developer, you know how hard it can be to synchronize state across extension contexts and handle messaging. Epos saves you time by solving these hard problems for you.
-->
