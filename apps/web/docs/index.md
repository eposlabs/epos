---
outline: [2, 3]
---

# Getting Started

## Overview

Epos (**ἔπος**, “epic story”; pronounced **EH-poss**), is an opinionated engine designed to simplify browser extension development. It supports all Chromium-based browsers, including Chrome, Edge, and Brave. Firefox and Safari are not supported.

While frameworks like [WXT](https://wxt.dev/) or [Plasmo](https://www.plasmo.com/) offer broad flexibility, Epos focuses on a **zero-config experience**. It provides a unique set of high-level features that "just work".

<!--
## Technologies

Epos is designed to work seamlessly with [React](https://react.dev). For state management, it relies on [MobX](https://mobx.js.org/) under the hood providing higher-level abstractions, so you don’t need to learn MobX directly. For data synchronization across extension contexts (popup, background, tabs, etc.), Epos uses [Yjs](https://yjs.dev/) to automatically handle conflict resolution.

You can opt out of these technologies, but doing so means giving up the core features that make Epos powerful.
-->

## Installation

Epos is not an NPM package. Instead, the engine itself is a browser extension that you install directly from the [Chrome Web Store](https://get.epos.dev).

Once installed, the workflow is simple:

1. **Connect** your local project directory to Epos via the extension interface.
2. **Develop:** Epos will execute its code within the browser.
3. **Export:** When ready, click the EXPORT button in the Epos interface. This generates a production-ready ZIP file for publishing to the Chrome Web Store.

Once the extension is installed, you **link your local project directory** to the Epos. The engine then executes your code within the browser environment. Epos can run any number of projects simultaneously.

When you are ready to distribute your extension, click the **EXPORT** button within the Epos interface. This generates a standard extension ZIP file, packaged and optimized for submission to the Chrome Web Store.

## Constraints

Epos is not a universal framework. It deliberately strips away the noise and doubles down on a specific tech stack to provide a developer experience that wouldn't be possible otherwise.

The engine prioritizes ease of use for the **95% of common use cases**, even if that means sacrificing granular flexibility in others. Epos isn't for everyone — but if you embrace its constraints, you get an incredibly powerful toolset in return.

#### Core Limitations:

- **React:** Epos is built specifically for the React ecosystem.
- **Chromium:** Firefox and Safari browsers are not supported.
- **Chrome APIs:** Only essential APIs are available; niche APIs are not supported.
- **Manifest V3:** No support for the legacy Manifest V2.
- **No HMR:** Hot Module Replacement is not supported, though live-reload is available.
- **No Source Maps:** Since Epos injects your code with its own engine runtime, source maps do not function as expected and thus, they are not supported. The support may appear in future releases.
- **Permissions:** Certain manifest permissions are required for the engine to function and cannot be omitted.

Even if you have doubts about whether Epos is the right fit for your project, at least give it a try. The installation and setup process is quick, and you may find that the streamlined workflow significantly accelerates your development process.
