# Rendering

This section covers the principles of rendering Epos applications using React, how to use Shadow DOM for style isolation, and the DOM structure managed by the engine.

This guide assumes you have already completed the [Vite setup](/guide/vite) and understand the [basic principles](/guide/getting-started) of building extensions with Epos.

::: info

Epos is designed to work **exclusively with React**. While you can use other UI libraries, some of the crucial features of Epos are built with React in mind. If you prefer other frameworks, Epos might not be the right fit for your project.

:::

## Basics

To get a component onto a web page, you don't need to manually create root elements or worry about where to append them. Epos handles the "mounting" logic for you. All you need to do is call the `epos.render()` method:

::: code-group

```tsx{12} [src/main.tsx]
import './main.css'

const App = () => {
  return (
    <div>
      Epos Extension
    </div>
  )
}

// Render App component on the page
epos.render(<App />)
```

```css [src/main.css]
/* Empty for now */
```

```json [epos.json]
{
  "name": "My Extension",
  "matches": "*://*.example.com/*",
  "load": ["dist/main.css", "dist/main.js"]
}
```

:::

Opening [example.com](https://example.com) will now show your React component rendered alongside the page's content.

## Shadow DOM Isolation

By default, Epos renders your app into the regular DOM. This means that your styles are exposed to the website and can potentially conflict with the page's styles.

#### The Conflict

Assume you added some styles for `div` in your `main.css`:

::: code-group

```css [src/main.css]
/* [!code --] */
/* Empty for now */
/* [!code ++] */
div {
  /* [!code ++] */
  font-size: 40px;
  /* [!code ++] */
}
```

:::

After applying the changes, you can see that the font size of both your app and the page's content has increased. However, you likely want to apply those styles only to your app, without affecting the page.

#### The Solution

To isolate your styles, use the `shadow:` prefix in `epos.json`. This tells Epos to inject your styles inside a **Shadow DOM** . Additionally, Epos will automatically render your application inside that Shadow DOM when calling `epos.render(<App/>)`:

::: code-group

```json [epos.json]
{
  "name": "My Extension",
  "matches": "*://*.example.com/*",
  "load": [
    "dist/main.js",
    // [!code --]
    "dist/main.css",
    // [!code ++]
    "shadow:dist/main.css"
  ]
}
```

:::

Now, your `40px` font size will only apply to divs inside your extension, leaving the rest of the page untouched.

## Adding Global Styles

Epos allows you to use **both global styles and isolated styles** on the same page. This is useful if you want to render your application inside a Shadow DOM for isolation while simultaneously modifying styles on the host page.

To achieve this, simply include **multiple CSS** entries in your `epos.json` — some with the `shadow:` prefix and some without:

::: code-group

```json [epos.json]
{
  "name": "My Extension",
  "matches": "*://*.example.com/*",
  "load": [
    "dist/global.css", // Applied to the whole page
    "shadow:dist/main.css", // Applied only to your extension
    "dist/main.js"
  ]
}
```

:::

## DOM Structure

But where does Epos render your application? To answer this, you can open DevTools and see the DOM structure created by the engine:

<!-- prettier-ignore -->
```html{3-7}
<!doctype html>
<html>
  <epos>
    <link rel="stylesheet" href="..." />
    <script src="..."></script>
    <div data-project-name="My Extension" data-project-id="...">...</div>
  </epos>
  <head>...</head>
  <body>...</body>
</html>
```

#### The Global Wrapper

The first thing to notice is the **`<epos>` element**. This is where Epos injects its runtime and your project's code. While the `epos` tag name isn't a standard HTML element, browsers treat custom tags exactly like regular `div` elements. Epos uses this name strictly for clarity.

Note that `<epos>` is **placed outside of the `<body>`** to avoid any conflicts with the page's content. This is a perfectly valid HTML structure, and browsers render content inside `<epos>` the same way they render content inside `<body>`.

#### Assets and Security

Inside `<epos>`, you can see two elements: `<link/>` and `<script/>`. These are the styles and scripts injected by Epos. Crucially, their **URLs are revoked** after loading so the website cannot access them directly. This **protects your code**; a malicious website won't be able to read your extension's logic or styles.

#### The Project Root

Below those, you will find a `<div>` with `data-project-name` and `data-project-id` attributes. This is the **root element** for your project. Let's zoom in on its internal structure:

<!-- prettier-ignore -->
```html
...
<div data-project-name="My Extension" data-project-id="...">
  <div data-view></div>
  <div data-shadow>
    #shadow-root (open)
      <div data-shadow-view></div>
  </div>
</div>
...
```

#### Project Elements

- `data-view`: This is the **default container** used for rendering your application. When you call `epos.render(<App/>)`, Epos mounts your app here.

- `data-shadow`: This element hosts the **Shadow DOM**. All `shadow:` styles are injected into this Shadow DOM.

- `data-shadow-view`: This container is used **instead of a `data-view`** container when rendering your application inside the Shadow DOM. If you have `shadow:` prefixed styles, calling `epos.render(<App/>)` will automatically use `data-shadow-view` as the container for your app.

## Custom Container

If you want to render your app into a custom container rather than the default `data-view` or `data-shadow-view`, you can simply pass the target DOM element as the **second argument** to the `epos.render()`:

```tsx
const container = document.createElement('div')
document.body.append(container)

epos.render(<App />, container)
```

## Strict Mode

When rendering your application with `epos.render()`, Epos **automatically wraps** your app in React's [`StrictMode`](https://react.dev/reference/react/StrictMode) component. This is recommended for all React applications as it helps identify potential issues and ensures your app follows best practices.

If you want to disable `StrictMode`, you can render your app manually using `createRoot()` instead of `epos.render()`:

```tsx
import { createRoot } from 'react-dom/client'

const container = document.createElement('div')
document.body.append(container)

createRoot(container).render(<App />)
```

## Accessing DOM Nodes

In most cases, you simply use `epos.render` and let Epos handle the rest. However, you may occasionally need to **access DOM nodes** created by Epos directly — for example, when integrating third-party libraries or debugging.

For accessing these nodes, Epos provides the following API:

#### `epos.dom.root`

The **root element** for your project (the `<div/>` containing the `data-project-name` attribute).

#### `epos.dom.view`

The **`data-view` element**, which serves as the default container for `epos.render()`.

#### `epos.dom.shadowRoot`

The **Shadow Root** element (the `#shadow-root` located inside the `data-shadow` element).

#### `epos.dom.shadowView`

The **default container** for `epos.render()` when using the Shadow DOM (the `<div>` with the `data-shadow-view` attribute).
