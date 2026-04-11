# Publishing

When you are ready to publish your extension, use the **Export** button at [app.epos.dev](https://app.epos.dev) dashboard to generate a standard extension package.

You do not publish the project folder itself. You publish the exported ZIP.

## Before You Export

At minimum, provide these fields in `epos.json`:

- `name` - The name of your extension as it appears to users.
- `version` - The version number, which must be updated for each release.
- `description` - A short and clear description of what your extension does.
- `icon` - The icon for your extension.

Also review your permission fields:

- `permissions`
- `optionalPermissions`
- `hostPermissions`
- `optionalHostPermissions`

Make sure you do not provide permissions that your extension does not need, as this can lead to rejection during review.

## Exporting

Open your project in [app.epos.dev](https://app.epos.dev) and click the **Export** button.

Epos generates a self-contained bundle for your project and downloads it as a ZIP file.

## What the Export Contains

The exported bundle is a standard browser extension package. It includes:

- A generated `manifest.json`.
- Your project source files.
- Your project assets.
- The Epos engine code.

The export contains only the required Epos code. It does not include `app.epos.dev` dashboard or any other development functionality.

## Test the Export

Before submitting to a store, it is a good idea to test the exported package. To install the exported extension:

1. Open `chrome://extensions`.
2. Enable **Developer mode** in the right-top corner.
3. Drag and drop the ZIP onto the page.

## Permission Justifications

When publishing to the Chrome Web Store, you may need to explain why some permissions are present. For the engine permissions, you can use these justifications:

- `alarms` - Wake up the background worker for scheduled tasks.
- `offscreen` - Use web APIs that are not available in the service worker.
- `unlimitedStorage` - Prevent automatic browser cleanup from removing extension data.
- `declarativeNetRequest` - Adjust headers to allow code injection to web pages.
- `scripting` - Inject scripts to web pages.
- `tabs` - Send and receive messages to and from web pages.
- `webNavigation` - Detect CSP errors on navigation.
- `sidePanel` - Render extension UI in the side panel.

If you have other project-specific permissions, you should provide your own justifications for those.
