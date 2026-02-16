---
outline: [2, 3]
---

# Basics

In this section, we will cover the core principles of building extensions with Epos. To keep things as simple as possible, we will start with **plain JavaScript and CSS**. This allows you to see the engine in action without needing a build step.

Once you are comfortable with the basics, we will walk through how to [set up a development environment](/docs/vite-setup) using **Vite, TypeScript, and React**.

## Installation

First, install Epos from the [Chrome Web Store](https://get.epos.dev). Yes, Epos is an extension itself that allows you build extensions on top of it.

Once installed, Epos automatically opens [app.epos.dev](https://app.epos.dev) in a new tab. This tab is automatically pinned, as it **must stay open** while you are developing your extension.

## Workflow

Epos uses a unique approach compared to other frameworks. Instead of a CLI-based workflow, Epos is a browser extension that runs your code and provides a dedicated interface for managing your projects at [app.epos.dev](https://app.epos.dev).

With Epos, you don't develop an extension in the usual sense; you create a project and run it directly within the engine. Epos can run any number of projects simultaneously, acting as the bridge between your local code and the browser.

When your project is ready for production, simply click **EXPORT** in the Epos interface. This generates a ZIP file containing a standalone extension, ready for submission to the Chrome Web Store or other marketplaces.

## Your First Project

Let's create a project and see how it works.

1. **Create a directory:** Start by creating an empty folder on your computer for your project.
2. **Create new project in Epos:** Go to [app.epos.dev](https://app.epos.dev) and click the **NEW PROJECT** button. This will create a new empty project inside the engine.
3. **Connect to Epos:** Click the **CONNECT** button in the top-right corner of the Epos interface. When the file picker opens, select the directory you created in step 1.

The browser will ask for your permission to access this folder. This is necessary for Epos to read your code and run it in the browser. Epos only accesses the files within this specific directory and cannot see any other files on your computer.

This workflow is powered by the [File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) — a modern browser feature that allows web applications to read and write files on your computer with your permission. Epos uses this API to create a live bridge between your project directory and the engine.

## epos.json

Now, open your project directory in your favorite code editor and create an `epos.json` file. This is the "heart" of every Epos project; it is where you describe how the engine should treat your code.

If you are familiar with `manifest.json` file in browser extensions, you can think of `epos.json` as a higher-level abstraction. You don't need a separate manifest to run your project; the engine automatically generates a valid manifest file for you upon export based on your project settings.

`epos.json` has only one required field: `name`. Add the following content:

::: code-group

```json [epos.json]
{
  "name": "My Extension"
}
```

:::

You will notice this name is instantly picked up in the Epos interface. The engine reacts to any changes in your directory as they happen. Just keep [app.epos.dev](https://app.epos.dev) open while you work so the engine can maintain this direct access to your files via the File System API.

## How to Load CSS

Right now, our project does nothing. Let’s change that by styling the [example.com](https://example.com) website.

First, create a file named `main.css`:

::: code-group

```css [main.css]
/* Let's make the background gold, just for fun! */
body {
  background: gold;
}
```

:::

Next, you need to tell Epos to inject this file. You’ll use the `matches` field to describe **where** the code should run, and the `load` field to describe **what** file should be loaded.

::: code-group

```json [epos.json]
{
  "name": "My Epos Extension",
  "matches": "https://example.com", // [!code ++]
  "load": "main.css" // [!code ++]
}
```

:::

After saving the file, no reload or extra steps are required; Epos picks up the changes instantly. Now, open [example.com](https://example.com) in your browser — you should see a bright gold background!

## Live Reloading

By default, the engine injects your code when the page loads. If you make changes to `main.css`, you would normally need to manually refresh [example.com](https://example.com) to see the result.

To speed up your workflow, Epos provides an **Auto-Reload** feature. Simply add `?autoreload` to your URL: https://example.com/?autoreload.

Now, whenever you make changes to `main.css`, the page will reload automatically. You can use this feature on any website where your project is active.

## Match Patterns

The `matches` field follows the [Match patterns](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns) syntax used by standard browser extensions. This means you can use the `*` wildcard to match multiple subdomains or paths.

For example, `*://*.example.com/*` translates to "all pages on example.com and its subdomains". Let's update our `epos.json` to use this broader pattern:

::: code-group

```json [epos.json]
{
  "name": "My Epos Extension",
  "matches": "https://example.com", // [!code --]
  "matches": "*://*.example.com/*", // [!code ++]
  "load": "main.css"
}
```

Now, the gold background isn't restricted to just the homepage. You can navigate to [example.com/anything](https://example.com/anything) or [www.example.com](https://www.example.com), and the engine will inject your styles.

:::

## How to Load JS

Changing styles is a great start, but let's add some logic. Create a file named `main.js` in your project directory (remember, we are sticking to plain JavaScript for now to keep things build-step free):

::: code-group

```js [main.js]
// Change the page content when it loads
document.addEventListener('DOMContentLoaded', () => {
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      Hello from Epos extension!
    </div>
  `
})
```

:::

Now, update the `load` field in `epos.json`. Since we are now loading multiple files, we change the field from a single string to an array:

::: code-group

```json [epos.json]
{
  "name": "My Epos Extension",
  "matches": "*://*.example.com/*",
  "load": [
    "main.css",
    "main.js" // [!code ++]
  ]
}
```

:::

After saving, open [example.com](https://example.com) again (don't forget the `?autoreload` trick if you want it to refresh automatically). You should see your new message displayed on the page, confirming that your JavaScript code is running successfully.

Congratulations — you’ve mastered the basics of Epos! The core philosophy is simple: you tell the engine **what** code to load and **where** to load it, and Epos handles the rest.

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
  "load": ["main.css", "main.js"], // [!code --]
  "matches": "<popup>", // [!code ++]
  "load": "popup.js" // [!code ++]
}
```

:::

Now, clicking the Epos extension icon will display your popup. It's that simple. If you'd prefer to use the browser's side panel instead, just change `<popup>` to `<sidePanel>`.

## Multiple Targets

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
      "load": ["main.css", "main.js"]
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
      "load": ["main.css", "main.js"]
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

## Export

Let's say we are happy with our project and want to share it with the world. To do this, simply click the **EXPORT** button in the Epos interface. This generates a ZIP file containing a standalone extension that you can submit to the Chrome Web Store or distribute as you like.
