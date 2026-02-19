# Basics

In this section, we will cover the core principles of building extensions with Epos. To keep things as simple as possible, we will start with **plain JavaScript and CSS**. This allows you to see the engine in action without needing a build step.

Once you are comfortable with these fundamentals, we will walk through how to [set up a development environment](/guide/vite) using **Vite, TypeScript, React, and TailwindCSS**.

## Installation

First, install Epos from the [Chrome Web Store](https://get.epos.dev). Yes, Epos is itself an extension that allows you to build other extensions on top of it.

Once installed, Epos will open [app.epos.dev](https://app.epos.dev) in a new tab. This tab is automatically pinned, as it **must remain open** while you develop your extension.

## Workflow

::: info TLDR

1. Connect your local folder to Epos.
2. Epos injects your files into the browser.
3. When ready, export to get a standalone ZIP.

:::

Epos takes a unique approach compared to other frameworks. Instead of being a CLI tool, Epos is a browser extension that executes your code directly. You connect a local folder to Epos, and the engine **injects your files** into the browser in real-time, acting as a bridge between your local code and the browser.

Each folder connected to Epos is called a **project**. You can have multiple projects connected at once, and Epos will run them simultaneously. You can manage all your projects at [app.epos.dev](https://app.epos.dev).

Finally, when you are ready to distribute your extension, you can export it as a standalone ZIP file. The exported ZIP contains your project files and the Epos runtime required to execute it. It does not include any development-only code from the `app.epos.dev` environment.

## Your First Project

Let's create our first project to see how it works:

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

## JSON Schema

Epos provides a JSON Schema for `epos.json`, which means your code editor can offer autocomplete and validation as you edit the file. This makes it easier to discover available options and avoid mistakes.

To enable this feature, simply add `$schema` field to your `epos.json`:

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json", // [!code ++]
  "name": "My Extension"
}
```

:::

Now you should see autocomplete suggestions for all available fields in `epos.json`.

::: info

Your code editor may ask you to confirm that you trust this URL before it can fetch the schema.

:::

## Load CSS

Right now, our project does nothing. Let’s change that by styling the [example.com](https://example.com) website.

First, create a CSS file for your styles. You can use any name you want, but let's name it `main.css`:

::: code-group

```css [main.css]
/* Let's make the background gold, just for fun! */
body {
  background: gold;
}
```

:::

Next, you need to tell Epos to inject this file on [example.com](https://example.com) website. You’ll use the `matches` field to describe **where** the code should run, and the `load` field to describe **what** file should be loaded.

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json"
  "name": "My Extension",
  "matches": "https://example.com", // [!code ++]
  "load": "main.css" // [!code ++]
}
```

:::

After saving the file, no reload or extra steps are required; Epos picks up the changes instantly. Now, open [example.com](https://example.com) in your browser — you should see a bright gold background!

## Live Reloading

The engine injects your code when the page loads. If you make changes to `main.css`, you would need to manually refresh [example.com](https://example.com) to see the result.

To speed up your workflow, Epos provides an **Auto-Reload** feature. Just add `?autoreload` to the URL: [example.com/?autoreload](https://example.com/?autoreload).

Now, whenever you make changes to `main.css`, the page will reload automatically. You can use this feature on any website where your project is active.

## Match Patterns

The `matches` field follows the [Match patterns](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns) syntax used by standard browser extensions. This means you can use the `*` wildcard to match multiple subdomains or paths.

For example, `*://*.example.com/*` translates to "all pages on example.com and its subdomains". Let's update our `epos.json` to use this broader pattern:

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json"
  "name": "My Extension",
  "matches": "https://example.com", // [!code --]
  "matches": "*://*.example.com/*", // [!code ++]
  "load": "main.css"
}
```

Now, the gold background isn't restricted to just the homepage. You can navigate to https://example.com/anything or https://www.example.com, and the engine will inject your styles.

:::

## Load JS

Changing styles is a great start, but let's add some logic. Create a file named `main.js` in your project directory (remember, we are sticking to plain JavaScript for now to keep things build-step free):

::: code-group

```js [main.js]
// Change the page content when it loads
document.addEventListener('DOMContentLoaded', () => {
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      Hello from Epos!
    </div>
  `
})
```

:::

Now, update the `load` field in `epos.json`. Since we are now loading multiple files, we change the field from a single string to an array:

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json"
  "name": "My Extension",
  "matches": "*://*.example.com/*",
  "load": [
    "main.css",
    "main.js" // [!code ++]
  ]
}
```

:::

After saving, open [example.com](https://example.com) again (don't forget the `?autoreload` trick if you want it to refresh automatically). You should see your new message displayed on the page, confirming that your JavaScript code is running successfully.

## Popup

One of the most common features of browser extensions is the popup that appears when you click the extension icon. Typically, you would need to set up a separate HTML file and reference it in your manifest. However, with Epos, there are no HTML files at all. Epos expects you to build your interface using only JavaScript and CSS.

To run your code in the popup, use the special `<popup>` keyword in the `matches` field:

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "matches": "*://*.example.com/*", // [!code --]
  "matches": "<popup>", // [!code ++]
  "load": ["main.css", "main.js"]
}
```

:::

Now, clicking the Epos extension icon will display your popup with "Hello from Epos!" message rendered on the gold background.

## Side Panel

If you'd prefer to use the browser's side panel instead of a popup, just change `<popup>` to `<sidePanel>` in your `epos.json`:

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "matches": "<popup>", // [!code --]
  "matches": "<sidePanel>", // [!code ++]
  "load": ["main.css", "main.js"]
}
```

Now, clicking the extension icon will open your interface in the side panel.

Next in this guide, we will assume that you stayed with the `<popup>`, but all the concepts apply to the side panel as well.

:::

## Multiple Targets

By adding the popup logic above, we replaced our `example.com` functionality. To run both at the same time, we should use **targets**. Targets allow you to define multiple independent environments within a single project.

Update your `epos.json` to move your configuration into the `targets` array:

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  // [!code ++]
  "targets": [
    // [!code ++]
    {
      // [!code ++]
      "matches": "<popup>",
      // [!code ++]
      "load": ["main.css", "main.js"]
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

Sometimes you need logic to run in the background, invisible for the user. Let's say we want to trigger an `alert('Hello from Epos!')` when our project starts. This is a pointless example, but is perfect to demonstrate the concept.

To do this, first create a `background.js` file:

::: code-group

```js [background.js]
alert('Hello from Epos!')
```

:::

Now you need to tell Epos that you want to load this code in the background. Can you guess what special keyword to use in the `matches` field? That's right, it's `<background>`! Update your `epos.json` to add a new target:

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "targets": [
    {
      "matches": "<popup>",
      "load": ["main.css", "main.js"]
    },
    {
      "matches": "*://*.example.com/*",
      "load": ["main.css", "main.js"]
    },
    // [!code ++]
    {
      // [!code ++]
      "matches": "<background>",
      // [!code ++]
      "load": "background.js"
      // [!code ++]
    }
  ]
}
```

:::

After saving, Epos will automatically pick up the changes as usual. You will see an alert pop up immediately, confirming that your background code is running successfully.

## How Background Works

In usual browser extensions, the background script is defined as a **Service Worker**. However, a Service Worker is a "closed" environment that cannot dynamically execute external code, meaning that Epos can not take your project code and execute it inside the Service Worker.

So where does Epos run your background code? The engine creates an **iframe inside an [offscreen document](https://developer.chrome.com/docs/extensions/reference/api/offscreen)** and injects your `<background>` code inside of it. This approach may seem unconventional, but it comes with two major advantages:

- **Full Web API Access:** A Service Worker cannot access some standard Web APIs like `document` or `URL`. With an offscreen iframe, you have full access to them. That's why our `alert` example worked without any issues, while it would be impossible to run the same code in a Service Worker as it doesn't have the `alert` function available.
- **Granular Reloading:** When you modify your background script, Epos reloads only that specific iframe. This prevents a full extension reload, meaning your other active contexts (like popups or injected scripts) stay intact and do not lose their state.

It is worth mentioning that Epos _does_ use a Service Worker to run its own core logic. However, your project code does not run inside that Service Worker; it runs in the separate iframe that Epos manages for you.

## Debugging the Background

Since the background script runs in a hidden iframe, finding your console logs or inspecting elements requires a few specific steps:

1. Open `chrome://extensions`.
2. Click the `Details` button on the Epos extension card.
3. Locate the `Inspect views` section and click on `offscreen.html`.
4. A DevTools window will open. To switch to your background context and get access to its `window` and other objects, select your project name in the **Context** dropdown (the menu that usually says "top" in the Console tab).

When you change your background code, Epos reloads the iframe automatically, but your DevTools stay connected. There is no need to repeat the steps above; you will remain in the context of your background script as you work.

## Export

When you are happy with your project and want to share it with others, you can export it for submission to the Chrome Web Store or other marketplaces. To prepare your project for the real world, you just need to add two final fields to your `epos.json`: `description` and `icon`.

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "description": "A brief, catchy summary of what your extension does.", // [!code ++]
  "icon": "icon.jpg", // [!code ++]
  "targets": [...]
}
```

**Description** is a simple string. The Chrome Web Store displays this as the first paragraph of your extension's listing, so make sure it is clear and engaging to attract potential users.

**Icon** is the path to an image file inside your project directory. You can use any common format like PNG, SVG, or JPG. During export, Epos crops the image to a square 500x500 and converts it to the PNG format required by browsers. If you need a placeholder image to test with, you can download an image from [picsum.photos](https://picsum.photos/128/128).

#### Generating the Bundle

Once `description` and `icon` are set, simply click the EXPORT button in the Epos interface.

Epos will package everything into a single **ZIP file**. This is a standalone extension, ready to be uploaded to the Chrome Web Store or other marketplaces. The ZIP file contains a valid `manifest.json` generated based on your `epos.json`, the Epos engine runtime, and all your project files.

The generated extension does not include any development-only code from the `app.epos.dev` environment. It bundles only your project files and the Epos runtime required to execute them.

## Summary

Congratulations — you’ve mastered the basics of Epos! The core principle is simple: you tell the engine **what** code to load and **where** to load it, and Epos handles the rest.

In the next sections we didn't even touch any Epos specific APIs that boost development and enable powerful features like cross-context communication, state management, and more. We will cover all of that in the next sections.
