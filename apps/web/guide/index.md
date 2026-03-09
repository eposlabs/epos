# Overview

Epos (**ἔπος**, “epic story”; pronounced **EH-poss**) is an opinionated engine for browser extension development. It supports all Chromium-based browsers, including Chrome, Edge, and Brave.

While frameworks like [WXT](https://wxt.dev/) or [Plasmo](https://www.plasmo.com/) offer more flexibility, Epos focuses on a **zero-config experience** and a set of built-in features that work with minimal setup.

## Installation

Epos is not distributed as an NPM package. Instead, the engine itself is a browser extension that you install directly from the [Chrome Web Store](https://get.epos.dev). In other words, Epos is an **extension for building other extensions**.

## Workflow

Once installed, the workflow is simple:

1. **Connect:** Link your local project directory to Epos.
2. **Develop:** Epos runs your code directly in the browser.
3. **Export:** Ready to ship? Click the **Export** button to get a standalone ZIP file.

## Philosophy

Epos is not a universal framework. It focuses on a specific tech stack to reduce setup and complexity.

The engine prioritizes ease of use for the **most common use cases**, even if that means giving up some flexibility. Epos is not for everyone, but if its constraints fit your project, it can make extension development simpler and more enjoyable.

## What You Get

At a high level, Epos gives you:

- A cross-context messaging system.
- Shared state with persistence and sync.
- Storage for files and other data.
- Chrome APIs available in any context.
- Automatic script injection + Shadow DOM.
- A simpler configuration via `epos.json`.

## Core Limitations

- **React:** Epos is built around React.
- **Chromium:** Firefox and Safari are not supported.
- **Manifest V3:** No support for the legacy Manifest V2.
- **No HMR:** Live reload is available, but hot module replacement is not.
- **No Source Maps:** Epos injects its runtime into your code, which breaks source maps.
- **Permissions:** Certain manifest permissions are required and cannot be omitted.

These limitations are intentional trade-offs that enable the specialized features that Epos provides. You can learn more about these in the [Features](/guide/features) section.

## Is It for You?

Epos fits best if you want to build a **Chromium extension with React**. It provides a focused toolset that speeds up development and reduces setup work. It has reasonable defaults for most use cases, and can be customized when needed.

However, if you need non-Chromium browsers support, require specific Chrome APIs, or want manual control over configuration, Epos might not be the right choice.
