# Getting Started

In this section, we will cover the core principles of building extensions with Epos. To keep things as simple as possible, we will start with **plain JavaScript and CSS**. This allows you to see the engine in action without needing a build step.

Once you are comfortable with the fundamentals, we will walk through how to [set up a development environment](/guide/vite) using **Vite, TypeScript, React, and Tailwind**.

## Installation

First, install Epos from the [Chrome Web Store](https://get.epos.dev). Once installed, Epos will open [app.epos.dev](https://app.epos.dev) dashboard in a new tab. This tab is automatically pinned, and it **must remain open** while you develop your extension.

## Workflow

Epos takes a unique approach to development. Instead of being a CLI tool, Epos is a browser **extension that executes your code**.

You **connect a local folder** to Epos, and the engine **injects your files** into the browser in real-time, acting as a bridge between your local code and the browser.

Each folder connected to Epos is called a **project**. The engine can run any number of projects simultaneously. You can manage and organize your projects via the dashboard at [app.epos.dev](https://app.epos.dev).

Finally, when you are ready to publish your extension, you can **export it as a standalone ZIP** file. This exported bundle contains your project files and the Epos runtime required to execute it. The exported ZIP does not include any code related to the `app.epos.dev` environment or other projects; **only related files are bundled**.

## Your First Project

Let's create your first project to see how it works:

1. **Create a directory:** Create an empty folder on your computer. This is where your project will live.

2. **Create a project in Epos:** Go to [app.epos.dev](https://app.epos.dev) and click the **New Project** button. This will create a new empty project inside the engine.

3. **Connect to Epos:** Inside **Template** section, select **None** and then click **Connect**. When the file picker opens, select the directory you created in step 1.

The browser will ask for your permission to access this folder. This is necessary for Epos to read your code and run it in the browser. Epos only accesses the files within this specific directory and cannot see any other files on your computer.

This workflow is powered by the [File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) — a modern browser feature that allows web applications to read and write files on your computer with your permission. Epos uses this API to create a live bridge between your project directory and the engine.

## epos.json

Now, open your project directory in your favorite code editor and create an `epos.json` file. This is the "heart" of every Epos project; it is where you describe how your extension should behave.

If you are familiar with browser extensions, you may be expecting a `manifest.json` file. However, Epos takes a different approach; it generates the `manifest.json` automatically during export based on the configuration you provide in `epos.json`.

`epos.json` has only one required field: `name`. Add the following content:

::: code-group

```json [epos.json]
{
  "name": "My Extension"
}
```

:::

You will notice this name is instantly picked up in the dashboard interface at [app.epos.dev](https://app.epos.dev). The engine reacts to any changes in your directory as they happen. Just keep the dashboard open while you work so the engine can maintain this direct access to your files via the [File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API).

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

Now you should see autocomplete suggestions for all available fields.

::: info

Your code editor may ask you to confirm that you trust this URL before it can fetch the schema.

:::

## Load CSS

Right now, our project does nothing. Let’s change that by styling the [example.com](https://example.com) website.

Create a `main.css` file in your project directory with the following content (you can use any file name and any styles you like, this is just an example):

::: code-group

```css [main.css]
/* Let's make the background gold, just for fun! */
body {
  background: gold;
}
```

:::

Next, you need to tell Epos to load this file on the [example.com](https://example.com) website. To do this, use the `matches` field to describe **where** the code should be loaded, and the `load` field to describe **what** file should be loaded:

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

Here we tell Epos to load `main.css` file on the `https://example.com` page.

After saving `epos.json`, no reload or extra steps are required; Epos picks up the changes instantly. Now, open [example.com](https://example.com) in your browser — you should see a bright gold background!

## Live Reloading

If you make changes to `main.css`, you would need to manually refresh [example.com](https://example.com) to see the changes applied.

To speed up your workflow, Epos provides an **Auto-Reload** feature. Just add `?autoreload` to the URL in your browser: [example.com/?autoreload](https://example.com/?autoreload).

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

Changing styles is a great start, but let's add some JavaScript logic. Create a file named `main.js` in your project directory (remember, we are sticking to plain JavaScript for now to keep things build-step free):

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

Now, update the `load` field in `epos.json`. Since we are now loading multiple files, we change the `load` field from a single string to an array:

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json"
  "name": "My Extension",
  "matches": "*://*.example.com/*",
  "load": "main.css", // [!code --]
  "load": ["main.css", "main.js"], // [!code ++]
}
```

:::

After saving, open [example.com](https://example.com) again (don't forget the `?autoreload` trick if you want it to refresh automatically). You should see "Hello from Epos!" message, confirming that your JavaScript code is running successfully.

## Popup

One of the most common features of browser extensions is the popup that appears when you click the extension icon. Typically, you would need to set up a separate HTML file and reference it in your `manifest.json`. However, with Epos, there are no HTML files at all. Epos expects you to build your interfaces using only JavaScript and CSS.

To load your code in the popup, use the special `<popup>` keyword in the `matches` field:

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

And don't worry about extension icon, Epos uses a default icon during development. When you export your project, you can set a custom icon in the `epos.json`. This is covered in the [Export](#export) section of this guide.

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

:::

Now, clicking the extension icon will open your app in the side panel.

## Multiple Matches

By adding the popup logic above, we removed our `example.com` functionality. To run both at the same time, we can simply define **matches** as an array:

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "matches": "<popup>", // [!code --]
  "matches": ["<popup>", "*://*.example.com/*"], // [!code ++]
  "load": ["main.css", "main.js"]
}
```

:::

Now both the `<popup>` and `example.com` are working. You can click the extension icon to see the popup, and open [example.com](https://example.com) to see that your styles and scripts are injected there as well.

## Targets

Let's say we do not want the gold background in the popup, but we want to keep it on the `example.com`. To achieve this, we can use `targets`.

Targets allow you to define **multiple environments** within a single project. Each target has its own `matches` and `load` fields, so you can specify exactly what code should run in each context.

Update your `epos.json` and move the configuration into the `targets` array:

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "matches": ["<popup>", "*://*.example.com/*"], // [!code --]
  "load": ["main.css", "main.js"], // [!code --]
  // [!code ++]
  "targets": [
    // [!code ++]
    {
      // [!code ++]
      "matches": "<popup>",
      // [!code ++]
      "load": ["main.js"]
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

That's it! Now `main.css` won't be loaded to `<popup>`.

## Background

Sometimes you need a logic to run in the background, invisible for the user. For example, we want to trigger an `alert()` when our project starts. This is a pointless example, but is perfect to demonstrate the concept.

To do this, first create a `background.js` file:

::: code-group

```js [background.js]
alert('Hello from Epos!')
```

:::

Now you need to tell Epos that you want to load this code in the background. Can you guess what special keyword to use in the `matches` field? That's right, `<background>`! Update your `epos.json` to add this new background target:

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "targets": [
    {
      "matches": "<popup>",
      "load": ["main.js"]
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
      "load": ["background.js"]
      // [!code ++]
    }
  ]
}
```

:::

After saving, Epos will automatically pick up the changes as usual. You will see an alert pop up immediately, confirming that your background code was executed successfully.

## How Background Works

In usual browser extensions, the background script is defined as a **Service Worker**. However, a Service Worker is a "closed" environment that cannot dynamically execute external code, meaning that Epos can not take your project code and execute it inside the Service Worker directly.

So where does Epos run your background code? The engine creates an **iframe** inside of an [offscreen document](https://developer.chrome.com/docs/extensions/reference/api/offscreen) and injects your `<background>` code into it. This approach may seem unconventional and overcomplicated, but actually it comes with two major advantages:

- **Full Web API Access:** A Service Worker cannot access some standard Web APIs like `document` or `URL`. With an offscreen iframe, you have full access to them. That's why our `alert` example worked without any issues, while it would be impossible to run the same code in a Service Worker as it doesn't have the `alert` function available.
- **Granular Reloading:** When you modify your background script, Epos reloads only that specific iframe. This prevents a full extension reload, meaning your other active contexts (like popups or injected scripts) stay intact and do not lose their state.

It is worth mentioning that Epos _does_ use a Service Worker to run its own core logic. However, your project code does not run inside that Service Worker; it runs in the offscreen iframe that Epos manages for you.

## Debugging the Background

Since the background script runs in a hidden iframe, finding your console logs or inspecting elements requires a few specific steps:

1. Open `chrome://extensions`.
2. Click the `Details` button on the Epos extension card.
3. Locate the `Inspect views` section and click on `offscreen.html`.
4. A DevTools window will open. To switch to your background context and get access to its `window` and other global objects, select your project name in the **Context** dropdown (the menu that usually says "top" in the Console tab).

When you change your background code, Epos reloads the iframe automatically, but your DevTools stay connected. There is no need to repeat the steps above; you will remain in the context of your background script as you work.

## Export

Let's say we are happy with our project and want to share it with the world. To do so, we need to export it as a standalone bundle. But first, we need to make the final adjustments to our project, add `description` and `icon`:

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

**Description** is a simple string, it is rendered in extension card under `chrome://extensions`. Also Chrome Web Store displays this as the first paragraph of your extension's listing, so make sure it is clear and engaging to attract potential users.

**Icon** is the path to an image file inside your project directory. You can use any common format like PNG, SVG, or JPG. During export, Epos resizes the image to a 128x128px and converts it to the PNG format. If you need a placeholder image to test with, you can download an image from [picsum.photos](https://picsum.photos/128/128). If you do not provide an icon, the default Epos icon will be used in the exported bundle.

#### Generating the Bundle

Once `description` and `icon` are set, simply click the **Export** button in the dashboard at [app.epos.dev](https://app.epos.dev). Epos will start the export process, which may take a few seconds. During this time, the engine packages your code and the engine's runtime into a single **ZIP file**. Once the process is complete, the ZIP file will be downloaded to your computer.

After that, you can publish the exported ZIP to the Chrome Web Store or other marketplaces. This ZIP file contains a standard web extension with `manifest.json` generated based on your `epos.json` configuration. The generated bundle does not include any development-only code from the `app.epos.dev`; it contains only your project files and the Epos runtime required to execute them.

No mention of Epos is present in the exported extension, it looks and behaves like a regular extension.
