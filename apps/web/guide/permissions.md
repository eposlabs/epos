# Permissions

Epos uses the same general permission model as normal browser extensions, but you describe those permissions in `epos.json` instead of writing a raw `manifest.json` by hand.

Some permissions are always added by the engine. Others are optional and depend on what your project needs.

## Engine Permissions

Every exported Epos extension includes a set of permissions required by the engine itself:

- `alarms`
- `declarativeNetRequest`
- `offscreen`
- `scripting`
- `tabs`
- `unlimitedStorage`
- `webNavigation`

If your project uses a `<sidePanel>` target, Epos also adds `sidePanel` automatically.

You do not need to declare these permissions yourself.

## Project Permissions

These are the extra permissions you can declare in `epos.json` today:

- `background`
- `browsingData`
- `contextMenus`
- `cookies`
- `downloads`
- `notifications`
- `sidePanel`
- `storage`

Add them to `permissions` if your extension always needs them:

```json
{
  "permissions": ["contextMenus", "cookies"]
}
```

## Optional Permissions

If a permission is needed only for some user flows, put it into `optionalPermissions` instead.

```json
{
  "optionalPermissions": ["downloads", "notifications"]
}
```

At runtime, request it through `epos.browser.permissions.request()`:

```ts
const granted = await epos.browser.permissions.request({
  permissions: ['downloads'],
})
```

This is the same general idea as `chrome.permissions.request()`, just through the Epos browser wrapper.

## Host Permissions

Host permissions are a little different.

In many cases, you do not need to write them manually. Epos automatically derives host permissions from your `targets.matches` patterns when exporting the manifest.

For example, this target:

```json
{
  "matches": "*://*.example.com/*",
  "load": ["dist/main.js"]
}
```

already implies host access to `example.com` and its subdomains.

## Manual Host Permissions

If your project needs host access beyond its normal targets, use `hostPermissions` or `optionalHostPermissions`.

```json
{
  "hostPermissions": ["https://api.example.com/*"],
  "optionalHostPermissions": ["https://*.another.com/*"]
}
```

If you want all URLs, use `<allUrls>` in `epos.json`.

```json
{
  "hostPermissions": ["<allUrls>"]
}
```

Use the camelCase Epos form. Do not use raw manifest names like `host_permissions` or `<all_urls>` inside `epos.json`.

## Unsupported Permissions

Epos does not expose every browser extension permission through `epos.json` yet.

If a permission is not in the supported list above, you should assume it is currently unsupported unless the docs say otherwise.

## Permission Justifications

When publishing to the Chrome Web Store, you may need to explain why some permissions are present. For the engine permissions, these explanations are a good starting point:

- `alarms` - Wake up the background worker for scheduled tasks.
- `declarativeNetRequest` - Adjust headers so project code can run reliably on web pages.
- `offscreen` - Use web APIs that are not available in the service worker.
- `scripting` - Register and inject project scripts.
- `tabs` - Interact with browser tabs and route messages.
- `unlimitedStorage` - Reduce the risk of browser cleanup removing extension data.
- `webNavigation` - Watch navigation events and react when pages change.

You should still describe your own extension-specific permissions in your own words.

## A Practical Rule

Keep the permission list as small as possible.

If a permission is always needed, put it in `permissions`.
If it is needed only after a user action, prefer `optionalPermissions`.
If it comes from a target match pattern, let Epos derive it automatically.

For more on project configuration, see the [epos.json guide](/guide/epos-json).
