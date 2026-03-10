# Fetch

`epos.fetch()` is a version of `fetch()` that runs through the extension instead of the page.

Its main purpose is to let page code make cross-origin requests that normal page `fetch()` cannot make because of CORS.

For exact signatures, see the [API reference](/api/general#epos-fetch).

## Why It Exists

Use normal `fetch()` by default.

Use `epos.fetch()` when all of these are true:

- your code runs on a web page or in an iframe
- you need to request another origin
- normal `fetch()` is blocked by CORS

`epos.fetch()` is not a better `fetch()` API. It is just a way to make the request from the extension side.

## Which URLs It Can Fetch

`epos.fetch()` can fetch URLs that your project has permission to access.

That access can come from:

- `matches`
- `hostPermissions`
- `optionalHostPermissions`, requested at runtime

If your project does not have permission for a URL, `epos.fetch()` will not be able to fetch it.

## Basic Usage

```ts
const response = await epos.fetch('https://api.example.com/data')
const data = await response.json()
```

The call shape is close to standard `fetch()`.

## Requesting Optional Host Access

If a remote API is only needed in one user flow, `optionalHostPermissions` is often the better choice.

::: code-group

```json [epos.json]
{
  "optionalHostPermissions": ["https://api.example.com/*"]
}
```

```ts [main.ts]
const granted = await epos.browser.permissions.request({
  origins: ['https://api.example.com/*'],
})

if (granted) {
  const response = await epos.fetch('https://api.example.com/data')
  const data = await response.json()
  console.log(data)
}
```

:::

For more on this model, see the [Permissions](/guide/permissions) guide.

## Limitations

`epos.fetch()` is close to normal `fetch()`, but it is not identical.

- streaming responses are not supported
- some `RequestInit` fields are missing
- some `Response` fields and methods are missing

If you rely on advanced fetch behavior, check the TypeScript types first.
