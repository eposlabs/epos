# Fetch

`epos.fetch()` gives you a way to make cross-origin requests.

When normal `fetch()` fails because of CORS restrictions, `epos.fetch()` can still make the request.

## Why It Exists

If your code runs on a page like `https://example.com` and tries to fetch another origin like `https://epos.dev`, the request will usually fail because of CORS restrictions. This is normal web page security.

Extensions can bypass that restriction. If your extension has permission to access `https://epos.dev`, it can make the request. Use `epos.fetch()` instead of `fetch()`, and Epos will route it through the extension.

## Which URLs It Can Fetch

`epos.fetch()` can fetch URLs that your project has permission to access.

That access can come from these `epos.json` fields:

- `matches`
- `hostPermissions`
- `optionalHostPermissions`, requested at runtime

If your project does not have permission for a URL, `epos.fetch()` will fail.

## Basic Usage

`epos.fetch()` uses the same API as `fetch()`:

```ts
const res = await epos.fetch('https://api.example.com/data')
const data = await res.json()
```

## Limitations

`epos.fetch()` is similar to normal `fetch()`, but it is not identical.

- Streaming responses are not supported.
- Some `RequestInit` fields are missing.
- Some `Response` fields and methods are missing.

All supported fields and methods are typed in TypeScript, so your editor can help you avoid unsupported features.
