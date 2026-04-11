# apps/server

Minimal Docker bundle that runs Caddy.

## Launch

From this folder:

```sh
docker compose up -d --build
```

## HTTPS

Caddy obtains and renews TLS certificates automatically.

Requirements:

- Ports `80` and `443` must be publicly reachable
- No other service should already be bound to those ports

No manual Certbot or certificate copy step is needed.

Caddy stores issued certificates and ACME state under `./data`, and runtime config under `./config`.

Trusted automatic HTTPS is configured for `get.epos.dev`.

Fallback requests on other hostnames are served by the generic HTTP site block. If you also want trusted HTTPS for another hostname, that hostname must have DNS pointing at this server and its own Caddy site block.

## Content

Static files are bundled from `site/` into the container.

Behavior:

- Requests for `get.epos.dev` are redirected to the Chrome Web Store listing
- Other HTTP requests are rewritten to `index.html`, so the same page is returned for `/`, `/foo`, `/bar/baz`, and similar paths
