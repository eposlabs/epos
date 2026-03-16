# Permissions

Epos uses the same permission model as normal browser extensions, but you declare those permissions in `epos.json` instead of `manifest.json`.

Some permissions are required for the engine to work, so they always end up in the resulting `manifest.json`. Most permissions, however, depend on your project's needs.

If you are not familiar with browser extension permissions, you can read the [Chrome permissions docs](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions) or the [MDN documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions).

## Engine Permissions

These permissions always end up in your extension because the engine requires them:

- `alarms`
- `offscreen`
- `unlimitedStorage`

If your project runs on websites or uses host permissions, Epos also adds:

- `declarativeNetRequest`
- `scripting`
- `tabs`
- `webNavigation`

If your project uses a `<sidePanel>` target, Epos also adds:

- `sidePanel`

## Supported Permissions

Epos supports most common extension permissions, but not all of them. Here is the list of all supported permissions:

- `alarms`
- `background`
- `browsingData`
- `contextMenus`
- `cookies`
- `declarativeNetRequest`
- `downloads.ui`
- `downloads`
- `notifications`
- `offscreen`
- `scripting`
- `sidePanel`
- `storage`
- `tabs`
- `unlimitedStorage`
- `webNavigation`

## Declaring Permissions

Declaring permissions in `epos.json` follows the same logic as adding permissions in a regular `manifest.json`. If your app needs a permission, declare it in the `permissions` field:

::: code-group

```json {3} [epos.json]
{
  "name": "My Extension",
  "permissions": ["downloads", "notifications"]
}
```

:::

## Optional Permissions

If a permission is needed only for some user flows and you want to ask for it at runtime, use `optionalPermissions`:

::: code-group

```json {3} [epos.json]
{
  "name": "My Extension",
  "optionalPermissions": ["downloads", "notifications"]
}
```

:::

Note that `manifest.json` uses `optional_permissions` in snake_case due to legacy reasons. Epos follows standard JavaScript conventions and uses camelCase instead.

At runtime, request it through `epos.browser.permissions.request()`:

```ts
const granted = await epos.browser.permissions.request({
  permissions: ['downloads'],
})
```

This is the same API as `chrome.permissions.request()`, just via `epos.browser`.

## Host Permissions

Host permissions work a little differently.

In many cases, you do not need to write them manually. Epos derives host permissions from your `matches` patterns.

For example, this `epos.json`:

::: code-group

```json {3} [epos.json]
{
  "name": "My Extension",
  "matches": "*://*.example.com/*",
  "load": ["dist/main.js"]
}
```

:::

already implies host access to `example.com` and its subdomains. So Epos adds `https://*.example.com/*` to `host_permissions` in the resulting `manifest.json`.

## Manual Host Permissions

But there are cases where your project needs host access beyond `matches`. For example, you may need to call `epos.fetch()` on a remote API. In that case, declare host permissions manually with `hostPermissions` or `optionalHostPermissions`:

::: code-group

```json {3-4} [epos.json]
{
  "name": "My Extension",
  "hostPermissions": ["https://api.example.com/*"],
  "optionalHostPermissions": ["https://*.another.com/*"]
}
```

:::

If you want all URLs, use `<allUrls>` in `epos.json`.

::: code-group

```json {3} [epos.json]
{
  "name": "My Extension",
  "hostPermissions": ["<allUrls>"]
}
```

:::

Notice that `<allUrls>` is also in camelCase, while standard `manifest.json` uses `<all_urls>` in snake_case.

## `epos.browser` Follows Permissions

`epos.browser.*` APIs follow the same rules as `chrome.*` APIs. If you do not have a permission, you cannot use the related API. For example, if you do not have the `downloads` permission, `epos.browser.downloads` will be unavailable (`undefined`).

If you put `downloads` in `optionalPermissions`, `epos.browser.downloads` stays unavailable until you request it and the user grants that permission.

In short, the behavior is the same as with `chrome.*` APIs. Epos only slightly changes how permissions are declared in `epos.json`.
