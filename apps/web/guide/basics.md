# Basics

This guide covers the core concepts of building extensions with Epos. To keep things simple, we will start with **plain JavaScript and CSS**. This lets you see the engine in action without a build step.

Once you are comfortable with these fundamentals, we will set up a development environment using [Vite](./vite).

## Workflow Overview

Epos uses a unique extension development workflow. Instead of being a CLI tool, Epos is a **browser extension that runs your code**.

You connect a local folder to the Epos extension, and the engine injects your files into the browser in real-time. It acts as a bridge between your code and the browser.

Each folder connected to Epos is called a **project**. The engine can run any number of projects at the same time. You can manage and organize your projects in the dashboard at [app.epos.dev](https://app.epos.dev).

Once you are ready to publish your extension, click the **Export** button in the dashboard. Epos will generate a standalone ZIP file that you can publish to the Chrome Web Store or other extension marketplaces.

## Install Epos

To get started, install Epos from the [Chrome Web Store](https://get.epos.dev).

Once installed, Epos will automatically open the [app.epos.dev](https://app.epos.dev) dashboard in a new pinned tab. This tab **must remain open** while you develop your extension.

## Create a Project Folder

Create an empty folder on your computer. This is where your project will live.

## Connect the Folder

In [app.epos.dev](https://app.epos.dev):

1. Click the **New Project** button.
2. Select the **None** template.
3. Click **Connect**.
4. Pick the folder you created.

The browser will ask for permission to access that folder. Epos only gets access to the folder you choose, not the rest of your disk.

Epos does not copy your project into some hidden location. It works directly with the folder you selected. This workflow is powered by the [File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API).

## Create `epos.json`

Inside the folder, create `epos.json`:

::: code-group

```json [epos.json]
{
  "name": "My Extension"
}
```

:::

This is the main config file where you describe your project.

You will see the name appear immediately in the dashboard at [app.epos.dev](https://app.epos.dev). The engine reacts to changes in your directory as they happen. Just keep the dashboard open while you work so Epos can maintain direct access to your files.

If you are familiar with browser extension development, you might expect a `manifest.json` file. With Epos, you do not need to provide one. It is generated automatically during the export step based on your `epos.json` config.

## Add Schema

To enable autocomplete and validation for `epos.json`, add the schema field:

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json", // [!code ++]
  "name": "My Extension"
}
```

:::

Your code editor may ask you to confirm that you trust this URL before it can fetch the schema.

## Load CSS on a Web Page

Right now the project exists, but it does not do anything. Let’s change that by styling [example.com](https://example.com).

Create `main.css`:

::: code-group

```css [main.css]
/* Make the background gold, just for fun! */
body {
  background: gold;
}
```

:::

Update `epos.json`:

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "matches": "https://example.com", // [!code ++]
  "load": "main.css" // [!code ++]
}
```

This config tells Epos to load the `main.css` file on the `https://example.com` page.

:::

Once saved, Epos picks up changes immediately. Open [example.com](https://example.com) and you should see the gold background.

## Auto Reload

If you modify `main.css`, you would need to reload the [example.com](https://example.com) page manually to see the changes. To enable automatic reloads, add `?autoreload` to the page URL in the browser.

Now, whenever you make changes, the page will reload automatically. You can use this feature on any website where your project is active.

## Match Patterns

The `matches` field follows the [match patterns](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns) syntax used by browser extensions. This means you can use the wildcard `*` to match multiple subdomains or paths.

For example, `*://*.example.com/*` means _"all pages on example.com and its subdomains"_.

Update `epos.json` to use this pattern:

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "matches": "https://example.com", // [!code --]
  "matches": "*://*.example.com/*", // [!code ++]
  "load": "main.css"
}
```

:::

Now, the gold background is not limited to just the homepage. You can navigate to [`https://example.com/anything`](https://example.com/anything) or [`https://www.example.com`](https://www.example.com), and the engine will inject your styles.

You can also match all websites with `<allUrls>` pattern.

## Load JavaScript

Changing styles is fun and all, but let's add some JavaScript logic.

Create `main.js`:

::: code-group

```js [main.js]
document.addEventListener('DOMContentLoaded', () => {
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      Hello, World!
    </div>
  `
})
```

:::

Update `epos.json` to load both `main.css` and `main.js` files:

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "matches": "*://*.example.com/*",
  "load": "main.css", // [!code --]
  "load": ["main.css", "main.js"] // [!code ++]
}
```

:::

That's it. The page should now show `Hello, World!` on the gold background.

Note how `load` can be either a string or an array of strings. This is a common pattern in Epos config to keep things concise for simple cases, while still supporting more complex setups.

## Epos API

Inside your JavaScript code, you can access the Epos API through the `epos` variable. You do not need to import anything. Epos injects the API into your code automatically.

For now, it is enough to know that `epos` is there when you need Epos-specific functionality. We will cover the API later.

## Popup

A very common extension UI is the popup that opens when the user clicks the extension icon.

In normal extension development, this usually means setting up a separate HTML file. Epos simplifies that by treating the popup as just another target.

Simply use `<popup>` in `matches`:

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

Clicking the Epos icon now opens your project as a popup.

And do not worry about the extension icon. Epos uses a default icon during development. When you export your project, you can set a custom icon via `epos.json`. This is covered in the [Export](#exporting) section of this guide.

## Popup Configuration

By default, Epos uses a vertical `380x572` popup. You can change that by providing a `popup` in `epos.json`:

::: code-group

````json {4} [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "popup": { "width": 500, "height": 300 },
  "matches": "<popup>",
  "load": ["main.css", "main.js"],
}

:::

## Side Panel

If you want a side panel instead of a popup, use `<sidePanel>`:

::: code-group

```json {4} [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "matches": "<sidePanel>",
  "load": ["main.css", "main.js"]
}
````

:::

This way, clicking the extension icon will open your app in the browser side panel.

## Multiple Matches

By adding the popup logic above, we removed our [example.com](https://example.com) functionality. To fix this, turn `matches` into an array:

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

Now both the popup and the [example.com](https://example.com) pages will load your files.

## Targets

When your project grows, you might want a more flexible setup. For example, you might want to load one set of files in the popup and a different set on the web page. This is where `targets` come in.

Instead of one top-level `matches` and `load`, you can define several target objects, each with its own rules:

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
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

## Background

Most non-trivial extensions need some logic that runs in the background. For example, we want to show an alert on extension startup.

Create `background.js`:

::: code-group

```js [background.js]
alert('Background started')
```

:::

Then add a `<background>` target in `epos.json`:

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

After saving, the background process will start automatically and you will see an alert.

## How Background Works

In normal browser extensions, the background script runs as a Service Worker. However, a Service Worker cannot dynamically execute code from your local files.

To avoid this limitation, Epos creates an `<iframe>` element inside an [offscreen document](https://developer.chrome.com/docs/extensions/reference/api/offscreen) and runs your background code there.

This approach may seem unconventional, but it comes with two major advantages:

- **Full Web API Access:** A Service Worker cannot access some standard APIs like `document`, `alert`, or `URL`. An offscreen document does not have these limitations. That is why our `alert` example worked.

- **Granular Reloading:** Epos can reload that background iframe without reloading the whole extension. This means your other contexts do not lose their state when the background refreshes.

Epos still uses a Service Worker to run its own background logic, but your project's background code always runs in the offscreen iframe.

## Debugging Background

To inspect the background context:

1. Open `chrome://extensions`.
2. Click `Details` on the Epos extension card.
3. Click `offscreen.html`. DevTools will open.
4. Go to `Console` tab.
5. Select your project from the DevTools context dropdown, which shows `top` by default.

When you change your background code, Epos reloads the iframe automatically, but your DevTools stay connected. There is no need to repeat the steps above. You will remain in the context of your background script as you work.

## Lite Mode for JavaScript

Epos always injects your code as soon as possible, but it does not guarantee that your code will be executed before the page's own scripts.

If you need that guarantee, use the `lite:` prefix for JavaScript files in `load`.

In this mode, Epos uses a different injection strategy to ensure your code executes _before_ any of the page's scripts.

This is useful when you need to patch global functions or do some setup before the page starts running its own code. You can mix `lite:` and normal files in the same `load` array:

::: code-group

```json {5} [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "matches": "*://*.example.com/*",
  "load": ["lite:patch.js", "main.js"]
}
```

:::

In `lite:` mode, Epos injects the file as-is and does not expose its APIs inside that script. In the example above, `patch.js` cannot access the Epos API, while `main.js` still can.

## Exporting

When the project is ready, add `description` and `icon` to `epos.json`:

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "description": "A short summary of what the extension does.", // [!code ++]
  "icon": "static/icon.svg", // [!code ++]
  "targets": [...]
}
```

:::

Then click **Export** in [app.epos.dev](https://app.epos.dev).

Epos will generate and download a ZIP file containing a normal Manifest V3 extension bundle. This bundle contains your project files, the engine files, and generated `manifest.json`.

**Note:** The provided icon will be transformed to 128x128 PNG during export.

## Load the Exported ZIP

Congratulations! You have built your first Epos extension.

You can load the exported ZIP file into your browser and see it in action:

1. Open `chrome://extensions`.
2. Enable **Developer mode** in the right-top corner.
3. Drag and drop the ZIP onto the page.
