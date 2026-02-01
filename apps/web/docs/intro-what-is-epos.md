# Getting Started

## What is Epos?

Epos (**ἔπος**, "epic story"; pronounced **EH-poss**), is an opinionated engine that simplifies browser extension development. It supports all Chromium-based browsers: Chrome, Edge, Brave, and others. Firefox and Safari are not supported.

Compared to other extension frameworks like [WXT](https://wxt.dev/) or [Plasmo](https://www.plasmo.com/), Epos takes a more opinionated approach and offers higher-level abstractions with minimalistic APIs.

## Tech Stack

Epos is designed to work seamlessly with [React](https://react.dev). For state management, it relies on [MobX](https://mobx.js.org/) under the hood providing higher-level abstractions, so you don’t need to learn MobX directly. For data synchronization across extension contexts (popup, side panel, background, tabs), Epos uses [Yjs](https://yjs.dev/), which automatically handles conflict resolution.

You can opt out of these technologies, but doing so means giving up some of Epos’s benefits.

## Features

Epos combines years of experience in extension development into a single tool with the following features:

#### Bus Messaging

Like `chrome.runtime.sendMessage`, but 10x better. Simply call `epos.bus.send` from any context, and Epos will deliver the message to all `epos.bus.on` listeners. It automatically handles routing by combining `chrome.runtime.sendMessage`, `chrome.tabs.sendMessage`, and `window.postMessage`.

#### Unified State Management

Epos provides a state object that acts like a standard JavaScript object, but with superpowers: any modifications are automatically persisted and synchronized across all extension contexts. Enjoy a true zero-config experience with no boilerplate and built-in automatic conflict resolution.

```ts
const state = await epos.state.connect({ name: 'my-extension' })
state.name = 'Epos' // Automatically persisted and synced
```

#### Simple Config

Just tell Epos what JS and CSS files to load and where, and it will handle the rest. No need to know how to inject scripts or styles into pages. No need to know the difference between isolated content script and main world content script. Epos provides easier-to-understand abstractions.

#### Chrome API that works everywhere

In regular extensions, if you inject some code to web pages, you can’t use `chrome.*` APIs there. Epos fixes that by utilizing the Bus system to proxy Chrome API calls from web pages to the background script, making `chrome.*` APIs available everywhere.

Epos **just works**, it has sensible defaults, and it takes care of all the boilerplate and edge cases for you.

#### Storage

Storage API provides key-value storage.

- Offscreen iframes to automate websites in the background

## Is Epos Right for You?

If you are just starting with extension development, Epos is an excellent choice as it abstracts away much of the complexity. You only need to know the basics of JavaScript and React.

If you are an experienced extension developer, you know how hard it can be to synchronize state across extension contexts and handle messaging. Epos saves you time by solving these hard problems for you.

## Installation

Epos is not provided as an NPM package. Instead, Epos itself is an extension that you install from the official [Chrome Web Store page](https://get.epos.dev). After installation, you link your project’s directory to the Epos extension, and Epos runs your code in the browser. Epos can run any number of projects simultaneously.

When you are finished with development, simply click **EXPORT ZIP** inside the Epos interface. Your project will be exported as a standard extension ZIP file that you can publish to the Chrome Web Store.

## Tutorial: Your First Extension

Let's create your first extension with Epos! First, install Epos from the [Chrome Web Store](https://get.epos.dev). Upon installation, open Epos by clicking its icon in the toolbar.

[https://shell.epos.dev](https://shell.epos.dev) should open automatically. This is the Epos interface where you manage your projects. Epos works differently from frameworks like Plasmo or WXT, where you run commands in a terminal to build extension code. Instead, you create Projects and connect them to the Epos extension, which then injects and runs your code in the browser. You can "eject" your project from Epos as a ZIP file, creating a standard extension ready for the Chrome Web Store or other marketplaces. The `shell.epos.dev` interface is stripped from the final build, leaving only the Epos engine and your code.

To create your first project, click the **+ NEW PROJECT** button. A dialog will appear asking you to select a project directory. Create a new empty directory on your computer and select it. Then, choose a project template. Select the **Blank** template for now and click **CREATE**.

Open your project directory in your favorite code editor and create an `epos.json` file. This is the "heart" of every Epos project where you configure how Epos should run your code. If you are familiar with `manifest.json`, you can think of `epos.json` as a higher-level abstraction over it. Epos generates the `manifest.json` automatically.

`epos.json` has only one required field, "name". Add the following content:

```json
{
  "name": "My Epos Extension"
}
```

You will see that this name is automatically picked up in shell.epos.dev. The interface reacts to changes in your directory automatically. Keep shell.epos.dev open while developing your extension.

For now our project does nothing, let's add some functionality. Let's say we want to change some styles on `example.com`. For this we need to create `example.css`:

```css
/* example.css */
body {
  /* Make page background gold */
  background: gold !important;
}
```

And then we need to tell Epos to load this CSS file on `example.com` pages. To do this, we need to add "matches" and "load" fields to `epos.json`:

```json
{
  "name": "My Epos Extension",
  "matches": "*://*.example.com/*",
  "load": "example.css"
}
```

No reload or any other action is needed, Epos automatically picks up changes. Now open `example.com` and see that the background is now gold! You can change `example.css`, reload `example.com` and see your changes. If you want Epos to automatically reload pages when you change code, just add `?autoreload` parameter to the URL: `https://example.com/?autoreload`. Now changing `example.css` will automatically reload the page.

That is all cool, but changing styles is not very exciting. Let's add some JavaScript code to our extension. Create `example.js` (not TS for now, as Epos requires a build step for TypeScript, which we will cover later) in your project directory:

```js
console.log('Hello from Epos extension!')
```

And then add it to `epos.json` `load` field:

```json
{
  "name": "My Epos Extension",
  "matches": "*://*.example.com/*",
  "load": ["example.css", "example.js"]
}
```

Open DevTools console on `example.com` and see the message from your extension!

Congratulations, you now know the basics of developing extensions with Epos! The main idea is that you tell Epos what code to load where, and Epos takes care of the rest.

### Adding a Popup

What if we want to load code inside the extension popup instead of a web page? The principle is the same: you just need to tell Epos to load code in the popup context.

Create `popup.js`:

```js
document.body.innerHTML = `
  <div>
    Hello from Epos Popup!
  </div>
`
```

And then tell Epos to load `popup.js` in `<popup>` context:

```json
{
  "name": "My Epos Extension",
  "matches": "<popup>",
  "load": "popup.js"
}
```

Now clicking on the Epos extension will show your popup. Simple as that. You can run your code in the side panel using the `<sidePanel>` match pattern, or in the background using `<background>`, but we will cover these later.

By changing `epos.json` we lost our example.com functionality. We want `popup.js` to be loaded in the popup and `example.js`/`example.css` on `example.com`. To do this, we need to use multiple `targets` in `epos.json`:

```json
{
  "name": "My Epos Extension",
  "targets": [
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

Voila! Now both popup and `example.com` functionality work.

### Adding a Background Script

Let's create `background.js`:

```js
console.log('Hello from Epos background!')
```

And then add it to `epos.json`:

```json
{
  "name": "My Epos Extension",
  "targets": [
    {
      "matches": "<popup>",
      "load": "popup.js"
    },
    {
      "matches": "*://*.example.com/*",
      "load": ["example.css", "example.js"]
    },
    {
      "matches": "<background>",
      "load": "background.js"
    }
  ]
}
```

In typical extensions, the background script runs as a service worker. Epos has its own service worker, but it cannot run arbitrary code (your project's code). Instead, Epos runs background code in an offscreen iframe. This might seem complicated, but it opens new possibilities. For example, you can use DOM APIs in the background script, which is impossible in service workers. Also, when you change the background script, Epos reloads it without needing a full extension reload—which usually leads to state loss in other contexts.

To open background DevTools, go to `chrome://extensions`, click "Details" for the Epos extension, find `offscreen.html`, and click it. The DevTools for the offscreen document will open. Then, choose your project from the context dropdown in the DevTools.

Let's modify `background.js`:

```js
window.value = 100
```

Save the file, navigate back to background DevTools, type `value` in the console and see `100`. The background iframe is automatically reloaded; you do not need to re-open DevTools on changes.

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
