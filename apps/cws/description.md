Epos is an engine for building Chromium extensions with React. Connect your local folder to Epos and start developing. When ready, just click "Export" to get a standalone ZIP file that you can publish.

⚡ What Epos gives you:

- A cross-context messaging system.
- Shared state with persistence and sync.
- Storage for files and other data.
- Extension APIs available in any context.
- Automatic script injection + Shadow DOM.
- A simpler setup through epos.json.

⚠️ Core Constraints:

- React: Epos is built around React.
- Chromium: Firefox and Safari are not supported.
- Manifest V3: No support for the legacy Manifest V2.
- No HMR: Live reload is available, but hot module replacement is not.
- No Source Maps: Epos injects its runtime into your code, so source maps do not work.
- Permissions: Certain manifest permissions are required and cannot be omitted.

To try it out, install Epos and follow the guide https://epos.dev/guide/basics
