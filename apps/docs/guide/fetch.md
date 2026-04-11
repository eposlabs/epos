# Fetch

`epos.fetch()` gives you a way to make cross-origin requests.

When normal `fetch()` fails due to CORS restrictions, `epos.fetch()` will work.

## Why It Exists

If your extension runs on a page like `example.com` and tries to fetch another origin like `google.com`, the request will fail because of CORS restrictions. This is normal web security behavior.

Extensions can bypass that restriction. If your extension has permission to access `google.com`, it can make the request. Use `epos.fetch()` instead of `fetch()`, and Epos will route the request through the extension.

## Which URLs It Can Fetch

`epos.fetch()` can fetch URLs that your project has permission to access.

That access can come from these `epos.json` fields:

- `matches`
- `hostPermissions`
- `optionalHostPermissions`

If your project does not have permission for a URL, `epos.fetch()` will fail.

## Usage

`epos.fetch()` uses the same API as `fetch()`:

```ts
const res = await epos.fetch('https://api.example.com/data')
const data = await res.json()
```

## Limitations

`epos.fetch()` is similar to normal `fetch()`, but it is not identical.

- Streaming responses are not supported.
- Some request parameters are missing.
- Some response fields and methods are missing.

All supported fields and methods are typed in TypeScript, so your editor can help you avoid unsupported features.
