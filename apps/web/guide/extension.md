# Extension APIs

`epos.browser` provides access to `chrome.*` APIs in every context of your extension.

Normally, you cannot access `chrome.*` from web pages or iframes. And in isolated content scripts, access is very limited. Epos removes these boundaries and lets you use the same APIs from any context.

::: info Why `epos.browser` and not `epos.chrome`?

There are two reasons for the name:

1. There is an ongoing effort to standardize the extensions API, and `browser` is the common name used for it.

2. `chrome` sounds Chrome-specific, but Epos also works with other Chromium browsers, including Edge and Brave. In that context, `browser` is a better fit.

:::

## The Same APIs

`epos.browser` does not give you a new APIs to learn. For supported APIs, it is a one-to-one mirror of `chrome.*`. For example:

```ts
const tabs = await epos.browser.tabs.query({ active: true })

epos.browser.windows.onCreated.addListener(window => {
  console.log('New window:', window.id)
})
```

If you know how to use `chrome.*`, you already know how to use `epos.browser.*`.

`epos.browser` is fully typed, so you get autocompletion and type checking in your editor.

To learn more, see the [Chrome Extensions API reference](https://developer.chrome.com/docs/extensions/reference/api) or the [MDN version](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API).

::: warning

When using Epos, you can not access `chrome` directly. Always use `epos.browser`.

:::

## Permissions Still Apply

`epos.browser` does not bypass the extension's permission system. If an API requires a permission, it still requires that permission when accessed via `epos.browser`.

For example, `epos.browser.downloads.*` needs the `downloads` permission, and `epos.browser.cookies.*` needs the `cookies` permission.

To request or inspect permissions at runtime, use `epos.browser.permissions`:

::: code-group

```ts [main.ts]
const granted = await epos.browser.permissions.request({
  permissions: ['downloads'],
})

if (granted) {
  await epos.browser.downloads.download({
    url: 'https://example.com/file.txt',
    filename: 'file.txt',
  })
}
```

```json {3} [epos.json]
{
  "name": "My Extension",
  "optionalPermissions": ["downloads"],
  "matches": "<popup>",
  "load": "main.js"
}
```

:::

To learn more about supported permissions, see the [Permissions](/guide/permissions) guide.

## Supported APIs

`epos.browser` does not support the full set of `chrome` APIs, but it does include the most commonly used ones:

- `action`
- `alarms`
- `browsingData`
- `contextMenus`
- `cookies`
- `declarativeNetRequest`
- `downloads`
- `extension`
- `i18n`
- `management`
- `notifications`
- `permissions`
- `runtime`
- `sidePanel`
- `storage`
- `tabs`
- `webNavigation`
- `windows`
