# Rendering

This guide explains how Epos renders React apps, how Shadow DOM fits into that process, and what DOM structure Epos creates for you.

It assumes you already familiar with the [Epos basics](/guide/getting-started) and have completed the [Vite setup](/guide/vite).

::: info

Epos is designed to work **exclusively with React**. You can use other UI libraries, but some of the crucial features of Epos are built with React in mind.

:::

## Basic Rendering

To render something with Epos, use `epos.render()`:

::: code-group

```tsx [main.tsx]
const App = () => {
  return <div>Epos Extension</div>
}

epos.render(<App />)
```

:::

You do not need to create a root element manually. Epos prepares one for the project and renders into it.

## Shadow DOM

By default, Epos renders into the normal DOM.

That means your styles can affect the page, and the page styles can affect your app.

If you have:

::: code-group

```css [main.css]
div {
  font-size: 40px;
}
```

:::

The increased font size will be applied to your `div` elements and to the pages `div`s as well.

## Isolating Styles with `shadow:`

To isolate your styles, prefix the CSS file in `epos.json` with `shadow:`.

::: code-group

<!-- prettier-ignore -->
```json {5} [epos.json]
{
  "name": "My Extension",
  "matches": "*://*.example.com/*",
  "load": [
    "shadow:dist/main.css"
    "dist/main.js",
  ]
}
```

:::

When Epos sees `shadow:`, it injects that CSS into a Shadow DOM automatically. And `epos.render(<App/>)` starts rendering your app inside that Shadow DOM as well.

That keeps your styles isolated from the page.

## Mixing Global and Shadow Styles

You can use both normal CSS and shadow CSS at the same time:

::: code-group

<!-- prettier-ignore -->
```json {5-6} [epos.json]
{
  "name": "My Extension",
  "matches": "*://*.example.com/*",
  "load": [
    "public/global.css",
    "shadow:dist/main.css",
    "dist/main.js"
  ]
}
```

:::

In that setup:

- `global.css` affects the host page,
- `main.css` affects only your rendered app inside Shadow DOM.

This is useful when your extension both changes the page and renders its own UI.

## DOM Structure

Epos injects a top-level `<epos>` element and places the project inside it.

A simplified structure looks like this:

<!-- prettier-ignore -->
```html {2-12}
<html>
  <epos>
    <link rel="stylesheet" href="..." />
    <script src="..."></script>
    <div data-project-name="My Extension" data-project-id="...">
      <div data-view></div>
      <div data-shadow>
        #shadow-root (open)
          <div data-shadow-view></div>
      </div>
    </div>
  </epos>
  <head>...</head>
  <body>...</body>
</html>
```

The important parts are:

- `<link>` element contains your global styles (without `shadow:` prefix).
- `<script>` element contains engine's runtime and your app code.
- `data-project-name` element is the root container for your project.
- `data-view` is the default container for `epos.render()`.
- `data-shadow` hosts the Shadow DOM.
- `data-shadow-view` is the default render container when using `shadow:` CSS.

## Why Outside of `<body>`?

Epos injects the project outside of `<body>` to prevent any conflicts with the page's content. This is a perfectly valid DOM structure, and browsers render content outisde of `<body>` the same way they render content inside `<body>`.

## Security

To prevent malicious web pages from reading your extension's code, Epos revokes the URLs of injected styles and scripts after loading, so the website cannot `fetch` them.

## Custom Containers

To customize rendering container, just pass it as the second argument to `epos.render()`:

```tsx
const container = document.createElement('div')
document.body.append(container)

epos.render(<App />, container)
```

In that case, Epos renders exactly where you tell it to.

## Strict Mode

`epos.render()` wraps the rendered tree in React [`StrictMode`](https://react.dev/reference/react/StrictMode).

It helps identify potential issues and ensures your app follows best practices.

If you need to disable `StrictMode`, you can use `createRoot()` directly:

```tsx
import { createRoot } from 'react-dom/client'

const container = document.createElement('div')
document.body.append(container)

createRoot(container).render(<App />)
```

## Useful DOM References

Epos also exposes the main DOM nodes through `epos.dom`:

- `epos.dom.root` - the root `data-project-name` element.
- `epos.dom.view`- the `data-view` element.
- `epos.dom.shadowRoot` - the Shadow DOM root.
- `epos.dom.shadowView` - the `data-shadow-view` element.

These are helpful when you need to integrate with a third-party library or attach something outside normal rendering flow.

## Practical Rule

Just use `epos.render()` unless you have a real reason not to.

Add `shadow:` to your CSS files to isolate styles from the page.

That covers most cases.
