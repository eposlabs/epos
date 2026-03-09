# Fetch

`epos.fetch()` is a version of `fetch()` that runs through the extension instead of the page.

Its main purpose is to let your code make cross-origin requests even when normal page `fetch()` would be blocked by CORS.

This guide covers when to use it and what limits still apply. For exact signatures, see the [API reference](/api/general#epos-fetch).

## Mental Model

Use normal `fetch()` by default.

Switch to `epos.fetch()` when all of these are true:

- your code runs on a web page or in an iframe
- you need to request another origin
- normal `fetch()` is blocked by CORS

So the value of `epos.fetch()` is not that it is a better fetch API. The value is that it can make the request from the extension side.

## Basic Example

```ts
const response = await epos.fetch('https://api.example.com/data')
const data = await response.json()
```

The call shape is intentionally close to standard `fetch()`.

## Why Normal `fetch()` Fails Here

If your extension code runs on `https://news.example.com`, the page is still bound by browser page security rules.

A request to `https://api.example.com` may fail because the target server does not allow that origin through CORS headers.

`epos.fetch()` avoids that page-level restriction by routing the request through the extension.

## Host Permissions Still Matter

This is the part that is easy to miss:

`epos.fetch()` bypasses page-level CORS checks, but it does not bypass extension host permissions.

If you fetch `https://api.example.com/data`, your project still needs access to `https://api.example.com/*`.

That access can come from:

- `matches`
- `hostPermissions`
- `optionalHostPermissions`, requested at runtime

## Requesting Optional Host Access

If that remote API is only needed in one user flow, `optionalHostPermissions` is usually the better choice.

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

## Common Use Cases

`epos.fetch()` is most useful for things like:

- calling a remote API from page-injected UI
- loading data from a domain outside your `matches`
- keeping request logic in the page code instead of moving it into the background first

## Limitations

`epos.fetch()` is close to normal `fetch()`, but it is not identical.

- streaming responses are not supported
- some `RequestInit` fields are missing
- some `Response` fields and methods are missing

The available shape is defined by the Epos TypeScript types.

So if you rely on advanced fetch behavior, check the types first.

## When Not to Use It

Do not treat `epos.fetch()` as the default network layer for everything.

If normal `fetch()` works, use normal `fetch()`.

If the request should happen in your background logic for architectural reasons, it can still make sense to keep it there and expose it through [Messaging](/guide/messaging).

## Practical Rule

Use `epos.fetch()` only when page code needs cross-origin network access and the standard browser fetch rules get in the way.

That keeps the intent clear and avoids using extra permissions when they are not needed.
