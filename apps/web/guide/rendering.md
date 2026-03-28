# Rendering

This guide explains how Epos renders React apps, how to use Shadow DOM for style isolation, and what DOM structure Epos creates for you.

It assumes you are already familiar with the [Epos basics](/guide/basics) and have completed the [Vite setup](/guide/setup).

::: info

Epos is designed to work **exclusively with React**. You can use other UI libraries, but some of the core Epos features are built with React in mind.

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

You do not need to create a root element manually. Epos prepares one automatically and renders into it.

## Style Injection

By default, Epos injects your styles into the main DOM.

That means your styles can affect the page, and the page styles can affect your app injected to this page.

If you have:

::: code-group

```css [main.css]
div {
  font-size: 40px;
}
```

:::

The increased font size will be applied to your `div` elements and to the page's `div`s as well.

## Isolating Styles with `shadow:`

To isolate your styles, prefix the CSS file in `epos.json` with `shadow:`.

::: code-group

<!-- prettier-ignore -->
```json {5} [epos.json]
{
  "name": "My Extension",
  "matches": "*://*.example.com/*",
  "load": [
    "shadow:dist/main.css",
    "dist/main.js",
  ]
}
```

:::

When Epos sees `shadow:`, it injects that CSS into a Shadow DOM automatically. `epos.render(<App />)` then renders your app inside that Shadow DOM as well.

That keeps your project's UI isolated from the page.

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

In this setup:

- `global.css` affects the host page,
- `main.css` affects only your rendered app inside Shadow DOM.

This is useful when your extension both changes the page and renders its own UI.

## DOM Structure

Epos injects a top-level `<epos>` element. All Epos-related content lives inside it, while the rest of the page remains intact.

The structure looks like this:

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

- `<link>` loads your global styles (the ones without the `shadow:` prefix).
- `<script>` loads the engine runtime and your app code.
- `data-project-name` is the root container for your project.
- `data-view` is the default container for `epos.render()`.
- `data-shadow` hosts the Shadow DOM.
- `data-shadow-view` is the default render container when using `shadow:` CSS.

## Why Outside the `<body>`?

Epos injects the project outside the `<body>` to avoid conflicts with the page content. This is valid DOM structure, and browsers render content outside the `<body>` the same way they render content inside it.

## Security

To prevent web pages from reading your extension code, Epos revokes the URLs of injected styles and scripts, so the page cannot read them.

## Custom Containers

To customize the render container, pass it as the second argument to `epos.render()`:

```tsx {4}
const container = document.createElement('div')
document.body.append(container)

epos.render(<App />, container)
```

In that case, Epos renders exactly where you tell it to.

## Strict Mode

`epos.render()` automatically wraps the rendered tree in React [`StrictMode`](https://react.dev/reference/react/StrictMode).

This helps catch potential issues and keeps your app aligned with React best practices.

If you need to disable `StrictMode`, you can render your app manually:

```tsx
import { createRoot } from 'react-dom/client'

const container = document.createElement('div')
document.body.append(container)

createRoot(container).render(<App />)
```

## Useful DOM References

Epos also exposes the main DOM nodes through `epos.dom`:

- `epos.dom.root` - the root `data-project-name` element.
- `epos.dom.view` - the `data-view` element.
- `epos.dom.shadowRoot` - the Shadow DOM root.
- `epos.dom.shadowView` - the `data-shadow-view` element.

These are helpful when you need to integrate with third-party libraries or attach something outside the normal rendering flow.

## Practical Rule

Just use `epos.render()` unless you have a real reason not to.

Add `shadow:` to your CSS files to isolate styles from the page.

That covers most cases.
