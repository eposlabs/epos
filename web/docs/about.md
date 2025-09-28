# About

## What is Epos?

Epos is an opinionated engine that simplifies browser extension development. It is built on top of [React](https://react.dev), [MobX](https://mobx.js.org/) and [Yjs](https://yjs.dev/). It supports any Chromium-based browsers: Chrome, Brave, Edge, etc. Firefox and Safari are not supported.

Compared to other extension engines like [WXT](https://wxt.dev/) or [Plasmo](https://www.plasmo.com/), Epos takes a more opinionated approach and offers higher-level abstractions with minimalistic APIs.

## Installation

Epos is not provided as an NPM package, instead, Epos itself is an extension which you install from the official [Chrome Web Store page](https://get.epos.dev). Then you link your project's directory to the Epos extension and Epos will run your code in the browser. Technically, Epos can run any number of projects simultaneously.

When you are finished with the development, you can click [export] button inside Epos interface and your project will be exported as a standard browser extension which you can publish to the Chrome Web Store.

## Motivation

Why Epos is not distributed as an NPM package? It is technically not possible to achieve the same level of development experience with just an NPM package. Epos sets up service worker, content script, offscreen page, injects your code to tabs and iframes, manages data synchronization & persistence and much more. All of these can't be done with just `npm install`, it requires a whole set of prerequisites which Epos extension provides out of the box with zero configuration.
