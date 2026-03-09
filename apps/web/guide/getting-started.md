# Getting Started

This guide covers the core principles of building extensions with Epos. To keep things as simple as possible, we will start with **plain JavaScript and CSS**. This allows you to see the engine in action without needing a build step.

Once you are comfortable with the fundamentals, we will walk through how to set up a development environment with [Vite](/guide/vite).

## Workflow Overview

Epos provides a unique extension development workflow. Instead of being a CLI tool, Epos is a **browser extension that runs your code**.

You connect a local folder to the Epos extension, and the engine injects your files into the browser in real-time, acting as a bridge between your code and the browser.

Each folder connected to Epos is called a **project**. The engine can run any number of projects simultaneously. You can manage and organize your projects via the dashboard interface at [app.epos.dev](https://app.epos.dev).

Once you are ready to publish your extension, simply click **Export** button in the dashboard. Epos will generate a standalone ZIP file ready to publish to Chrome Web Store or other marketplaces.

## Install Epos

To get started, install Epos from the [Chrome Web Store](https://get.epos.dev).

Once installed, Epos will automatically open [app.epos.dev](https://app.epos.dev) dashboard in a new pinned tab. This tab **must remain open** while you develop your extension.

## Create a Project Folder

Create an empty folder on your computer. This is where your project will live.

## Connect the Folder

In [app.epos.dev](https://app.epos.dev):

1. Click **New Project** button.
2. Select the **None** template.
3. Click **Connect**.
4. Pick the folder you created.

The browser will ask for permission to access that folder. Epos only gets access to the folder you choose, not the rest of your disk.

Epos is not copying your project into some hidden place. It works directly with the folder you selected. This workflow is powered by the [File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API).

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

You will see that the name is instantly picked up in the dashboard interface at [app.epos.dev](https://app.epos.dev). The engine reacts to any changes in your directory as they happen. Just keep the dashboard open while you work so Epos can maintain direct access to your files.

If you are familiar with browser extension development, you might expect `manifest.json` file. With Epos, you do not need to provide `manifest.json` at all, it is automatically generated during export step based on your `epos.json` config.

## Add Schema

To enable autocomplete and validation for `epos.json`, add schema:

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

Right now the project exists, but it does not do anything. Let’s change that by styling the [example.com](https://example.com) website.

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

This config tells Epos to load `main.css` file on `https://example.com` page.

:::

Once saved, Epos picks up changes immediately. Open [example.com](https://example.com) and you should see the gold background.

## Auto Reload

If you modify `main.css`, you would need to manually reload the [example.com](https://example.com) page to see the changes. To enable automatic reloads, just add `?autoreload` to the page URL in the browser.

Now, whenever you make changes, the page will be reloaded automatically. You can use this feature on any website where your project is active.

## Match Patterns

The `matches` field follows the [Match patterns](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns) syntax used by browser extensions. This means you can use the wildcard `*` to match multiple subdomains or paths.

For example, `*://*.example.com/*` means _all pages on example.com and its subdomains_.

Update `epos.json` to use this pattern:

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

:::

Now, the gold background isn't restricted to just the homepage. You can navigate to https://example.com/anything or https://www.example.com, and the engine will inject your styles.

## Load JavaScript

Changing styles is great, but let's add some JavaScript logic.

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

That's it. Now the page should show "Hello, World!" on the gold background.

Note how `load` can be either a string or an array of strings. This is a common pattern in Epos config to keep things concise for simple cases, while still supporting more complex setups.

## Popup

A very common extension UI is the popup shown when the user clicks the extension icon.

In normal extension development, this usually means setting up a separate HTML file. Epos simplifies that by treating popup as just another target.

Just use `<popup>` in `matches`:

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

And don't worry about extension icon, Epos uses a default icon during development. When you export your project, you can set a custom icon via `epos.json`. This is covered in the [Export](#export) section of this guide.

## Side Panel

If you want a side panel instead of a popup, replace `<popup>` with `<sidePanel>`:

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

Now, clicking the extension icon will open your app in the browser side panel.

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

When your project grows, you might want more flexible setup. For example, you might want to load one set of files in the popup, and a different set on the web page. This is where `targets` come in.

Instead of one top-level `matches` and `load`, you can define several target objects, each with its own rules.

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

## Background Code

Most non-trivial extensions need some logic that runs in the background.

Create `background.js`:

::: code-group

```js [background.js]
alert('Background started')
```

:::

Then add `<background>` target in `epos.json`:

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

After saving, background process will be started automatically and you will see an alert.

## How Background Works

In normal browser extensions, the background script runs as a Service Worker. However, a Service Worker cannot dynamically execute code from your local files.

To avoid this limitation, Epos creates `<iframe>` element inside an [offscreen document](https://developer.chrome.com/docs/extensions/reference/api/offscreen) and runs your background code there.

This approach may seem unconventional, but actually it comes with two major advantages:

- **Full Web API Access:** A Service Worker cannot access some standard APIs like `document`, `alert`, or `URL`. Offscreen document, on the other hand, does not have these limitations. That's why our `alert` example worked just fine.

- **Granular Reloading:** Epos can reload that background iframe without reloading the whole extension. This means your other contexts do not lose their state when background refreshes.

It is worth mentioning that Epos uses a Service Worker to run its own background logic. But your project’s background code runs in the offscreen iframe, which is separate from the engine's Service Worker.

## Debugging Background Code

To inspect the background context:

1. Open `chrome://extensions`.
2. Click `Details` on the Epos extension card.
3. Click `offscreen.html`, DevTools will open.
4. Go to `Console` tab.
5. Select your project from the DevTools context dropdown (displays "top" by default)

When you change your background code, Epos reloads the iframe automatically, but your DevTools stay connected. There is no need to repeat the steps above; you will remain in the context of your background script as you work.

## Exporting

When the project is ready, fill in the basic metadata in `epos.json`.

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "description": "A short summary of what the extension does.",
  "icon": "icon.png",
  "targets": [
    {
      "matches": "<popup>",
      "load": ["main.js"]
    }
  ]
}
```

:::

Then click **Export** in [app.epos.dev](https://app.epos.dev).

Epos downloads a ZIP file containing a normal Manifest V3 extension bundle. That exported bundle is what you test, upload, and publish.

This is another important part of the Epos model: development is Epos-specific, but the output is still a normal browser extension.

## Where to Go Next

At this point, the important ideas should be clear:

- Epos works from a live local folder.
- `epos.json` describes where code runs and what gets loaded.
- popup, side panel, page targets, and background all use the same target model.
- export turns that project into a standard extension bundle.

Now you can move on to the [Vite setup](/guide/vite) guide and add a proper React and TypeScript toolchain on top of this workflow.
