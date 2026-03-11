# Publishing

When you are ready to publish your extension, click the **Export** button in the [app.epos.dev](https://app.epos.dev) dashboard. Epos generates a ZIP file containing a standard browser extension package that you can submit to the Chrome Web Store or other extension marketplaces.

## Before You Export

At minimum, provide these fields in `epos.json`:

- `name` - the name of your extension as it appears to users.
- `version` - the version number, which must be updated for each release.
- `description` - a short and clear description of what your extension does.
- `icon` - the icon for your extension.

Also review your permissions:

- `permissions`
- `optionalPermissions`
- `hostPermissions`
- `optionalHostPermissions`

Make sure you do not provide permissions that your extension does not need, as this can lead to rejection during review.

## Exporting

Open your project in [app.epos.dev](https://app.epos.dev) and click the **Export** button.

Epos generates an export bundle for your project and downloads it as a ZIP file.

## What the Export Contains

The exported bundle is a standard browser extension package. It includes:

- A generated `manifest.json`.
- Your project source files.
- Your declared assets.
- The Epos engine code.

In other words, the export is self-contained.

It contains only the Epos code required to run your project. It does not depend on `app.epos.dev` or any other development functionality.

## Test the Export

Before submitting to a store, it is a good idea to test the exported package as a standalone extension.

A simple workflow is:

1. Export the ZIP.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Drag and drop the ZIP onto the page.
5. Test the extension as a standalone build.

This helps catch configuration mistakes before review.

## Permission Justifications

When publishing to the Chrome Web Store, you may need to explain why some permissions are present. For the engine permissions, you can use these justifications as they are:

- `alarms` - Wake up the background worker for scheduled tasks.
- `offscreen` - Use web APIs that are not available in the service worker.
- `unlimitedStorage` - Prevent automatic browser cleanup from removing extension data.
- `declarativeNetRequest` - Adjust headers to allow code injection to web pages.
- `scripting` - Inject scripts to web pages.
- `tabs` - Send and receive messages to and from web pages.
- `webNavigation` - Detect CSP errors on navigation.
- `sidePanel` - Render extension UI in the side panel.

If you have other project-specific permissions, you should provide your own justifications for those.
