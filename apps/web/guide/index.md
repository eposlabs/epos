# Overview

Epos (**ἔπος**, “epic story”; pronounced **EH-poss**) is an opinionated engine for building Chromium browser extensions with React.

While frameworks like [WXT](https://wxt.dev/) and [Plasmo](https://www.plasmo.com/) offer more flexibility, Epos gives you a **zero-config experience** and **powerful built-in features** that work out of the box.

## Installation

Epos is not distributed as an npm package. Instead, the engine itself is a browser extension that you install from the [Chrome Web Store](https://get.epos.dev). In other words, Epos is an **extension for building other extensions**.

## Workflow

Once installed, the workflow is simple:

1. **Connect:** Link your local project folder to Epos.
2. **Develop:** Epos runs your code directly in the browser.
3. **Export:** Ready to ship? Click the **Export** button to get a standalone ZIP file.

## Philosophy

Epos is not a universal framework. It focuses on a specific tech stack to **reduce setup and complexity**.

It also rethinks how extensions can be built, making trade-offs that allow a **smoother developer experience** and more **powerful built-in features**.

Epos prioritizes ease of use for the **most common use cases**, even if that means giving up some flexibility.

## What You Get

At a high level, Epos gives you:

- A cross-context messaging system.
- Shared state with persistence and sync.
- Storage for files and other data.
- Chrome APIs available in any context.
- Automatic script injection + Shadow DOM.
- A simpler setup through `epos.json`.

## Core Constraints

- **React:** Epos is built around React.
- **Chromium:** Firefox and Safari are not supported.
- **Manifest V3:** No support for the legacy Manifest V2.
- **No HMR:** Live reload is available, but hot module replacement is not.
- **No Source Maps:** Epos injects its runtime into your code, so source maps do not work.
- **Permissions:** Certain manifest permissions are required and cannot be omitted.

These constraints are intentional trade-offs that make Epos's features possible. You can learn more about them in the [Features](/guide/features) section.

## Is It for You?

Epos fits best if you want to build a **Chromium extension with React**. The engine gives you a powerful toolset with minimal setup. It has reasonable defaults for most use cases and can be customized when needed.

However, if you need support for non-Chromium browsers, require specific Chrome APIs, or want full manual control over configuration, Epos might not be the right choice.
