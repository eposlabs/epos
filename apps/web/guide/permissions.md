# Permissions

Epos follows the same permissions model as the regular web extensions. Yet some permissions are not available in Epos and there

## Full List of Permissions

Here is the full list of all permissions supported by Epos:

Required:

- `alarms`
- `declarativeNetRequest`
- `offscreen`
- `scripting`
- `tabs`
- `unlimitedStorage`
- `webNavigation`

Optional:

- `background`
- `browsingData`
- `contextMenus`
- `cookies`
- `downloads`
- `notifications`
- `sidePanel`
- `storage`

Rqeuired permissions are mandatory for all Epos extensions. The engine requires them to work properly. So even if your application does not use any of them, the resulting extension will still have them in its `manifest.json` file.

## Other Permissions

Browser extensions allow you to request other permissions as well, such as `bookmarks` or `history`. Epos does not support them so you can not create `history` management tool using Epos. The support may be added in the future.

## Permission Justification

When publishing to Chrome Web Store, you need to provide a justification for some of the permissions. Here are the justifications for the permissions used by Epos, you can simply copy-paste them when submitting your extension:

- `alarms` - Wake up Service Worker to perform background tasks
- `declarativeNetRequest` - Modify headers to allow code to be executed within web pages
- `offscreen` - Working with Blobs and other Web APIs not available in Service Worker
- `scripting` - Dynamically register content scripts
- `tabs` - Send messages to tabs using `chrome.tabs.sendMessage`
- `unlimitedStorage` - Prevent IndexedDB from being cleared by the browser
- `webNavigation` - Watch navigation to automatically fix CSP errors

## Optional Permissions

Optional permissions are not required for the extension to work, but they allow you to use additional APIs. To access those permissions, same as with `manifest.json`, you need to explicitly request them in `epos.json`:

::: code-group

```json
{
  "permissions": ["contextMenus", "cookies"]
}
```

:::

To request optional permissions, you should use `optionalPermissions` field in `epos.json`:

::: code-group

```json [epos.json]
{
  "permissions": ["contextMenus", "cookies"],
  "optionalPermissions": ["tabs", "webNavigation"]
}
```

Note that in regular `manifest.json`, the field is called `optional_permissions`. Manifest uses snake_case due to historical reasons, but in `epos.json` we use camelCase for consistency with the rest of the JavaScript ecosystem.

:::

To request optional permissions at runtime, you would normally use `chrome.permissions.request()`. However, Epos replaces `chrome.*` API with `epos.browser.*`, so you should call `epos.browser.permissions.request()` instead:

```ts
const granted = await epos.browser.permissions.request({
  permissions: ['tabs', 'webNavigation'],
})
```

## Host Permissions

Usually you do not need to worry about host permissions. All match patters from your `targets` are automatically registered as host permissions in the resulting `manifest.json` during export. However, if you need manual control, e.g. you perform `fetch` requests to foreign domains, you should specify those hosts in `hostPermissions` or `optionalHostPermissions` field. They work the same way as regular `host_permissions` and `optional_host_permissions` in `manifest.json`.

To learn more about permissions, read the official Chrome extension documentation: https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions
