# Browser API

`epos.browser` is the Epos wrapper around supported `chrome.*` APIs.

The main difference is where you can use it. In a normal extension, many browser APIs are limited to the service worker or extension pages. With Epos, the same APIs can also be called from web pages and iframes.

This guide focuses on the practical mental model. For exact method signatures, see the [API reference](/api/general#epos-browser).

## Mental Model

The goal of `epos.browser` is simple:

- Keep the familiar `chrome.*` namespace structure.
- Make it work in more execution contexts.
- Keep the normal extension permission rules.

So in practice, you can think of it as `chrome.*`, but routed through Epos when the current context does not have direct access.

## Why It Exists

This is most useful when your code runs on a web page or in an iframe.

In those places, standard extension APIs are normally unavailable. Without Epos, you would often need to move that logic into the background and build a message bridge first.

With `epos.browser`, many of those cases can stay in the same place.

## Basic Example

Query tabs from code running on a page:

```ts
const tabs = await epos.browser.tabs.query({ active: true })
console.log(tabs)
```

This would not normally work from a regular web page context.

## Using `epos.env` Together with `epos.browser`

`epos.env` is often a good companion to `epos.browser`.

For example, if your code belongs to a tab, you can inspect that tab directly:

```ts
const tab = await epos.browser.tabs.get(epos.env.tabId)
console.log(tab.url)
```

This is a common pattern when the same code may run in several places, but still needs to know about the current tab or window.

## Event Listeners

Listeners follow the same general shape as Chrome APIs:

```ts
epos.browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log('Updated tab:', tabId, tab.url)
})
```

When listeners are attached from a page context, Epos keeps track of them and cleans them up when that page goes away.

## Permissions Still Apply

`epos.browser` changes where you can call browser APIs from. It does not change what those APIs are allowed to do.

If an API needs a permission in Chrome, assume it still needs that permission in Epos.

For example:

- `epos.browser.downloads.*` needs `downloads`.
- `epos.browser.cookies.*` needs `cookies`.
- `epos.browser.permissions.*` is used to inspect or request optional permissions.

Typical runtime request:

::: code-group

```json [epos.json]
{
  "optionalPermissions": ["downloads"]
}
```

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

:::

For the full permission model, see the [Permissions](/guide/permissions) guide.

## Supported APIs

`epos.browser` does not expose the entire Chrome Extensions API.

The supported subset is typed and documented by Epos. If you try to use a namespace that Epos does not support yet, assume it is not available.

Still, the official Chrome docs are useful for understanding the general behavior of tabs, windows, downloads, cookies, and other extension namespaces:

- [Chrome Extensions API reference](https://developer.chrome.com/docs/extensions/reference/api)

Use the Chrome docs for the concepts, then check the Epos types and API reference for what is actually exposed.

## When Not to Use It

`epos.browser` is not the answer to every cross-context problem.

If you need to talk to your own background logic, popup, or side panel, use [Messaging](/guide/messaging).

If you need to make HTTP requests, use normal `fetch()` first, and switch to [Fetch](/guide/fetch) only when page-level CORS gets in the way.

## Practical Rule

Use `epos.browser` when you want extension APIs, but your code is running somewhere that normally would not have them.

That is the main value.
