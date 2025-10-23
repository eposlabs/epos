# What is Epos?

Epos is an opinionated engine that simplifies browser extension development. It supports all Chromium-based browsers: Chrome, Edge, Brave, and others. Firefox and Safari are not supported.

Compared to other extension frameworks like [WXT](https://wxt.dev/) or [Plasmo](https://www.plasmo.com/), Epos takes a more opinionated approach and offers higher-level abstractions with minimalistic APIs.

## Technology Stack

Epos is designed to work seamlessly with [React](https://react.dev). For state management, it relies on [MobX](https://mobx.js.org/) under the hood providing higher-level abstractions, so you don’t need to learn MobX directly. For data synchronization across extension contexts (popup, side panel, background, tabs), Epos uses [Yjs](https://yjs.dev/), which automatically handles conflict resolution.

You can opt out of these technologies, but doing so means giving up some of Epos’s benefits.

## Workflow

Epos is not provided as an NPM package, instead, Epos itself is an extension which you install from the official [Chrome Web Store page](https://get.epos.dev). After installation, you can link your project’s directory to the Epos extension, and Epos will run your code in the browser. Epos can run any number of projects simultaneously.

When you are finished with the development, click **[EXPORT]** button inside Epos interface, and your project will be exported as extension ZIP file that you can publish to the Chrome Web Store.

<!-- ## Philosophy

Epos alters how you should think about extension development. Basically it all comes down to this: you tell Epos _what_ JS and CSS to load and _where_. For example: load `popup.js` and `popup.css` in the popup, and `web.js` and `web.css` on all web pages. -->
