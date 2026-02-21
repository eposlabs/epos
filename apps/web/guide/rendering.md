# Rendering

In the previous section we covered the basisc of developing with Epos and set up Vite environment. Now we have everything to get deeper and start using Epos APIs.

This section assumes you have your project set up with Vite and ready to go. If you don't have it, you can create it by following the instructions in the previous section.

## Render React

Let's create our first React component App that will render our application. Create a file `src/app.tsx` in your project directory with the following content:

::: code-group

```tsx [src/app.tsx]
const App = () => {
  return <div>Epos Extension</div>
}
```

:::

And configure `epos.json` as follows:

::: code-group

```json [epos.json]
{
  "$schema": "https://epos.dev/schema.json",
  "name": "My Extension",
  "targets": [
    {
      "matches": "*://*.example.com/*",
      "load": ["dist/app.js"]
    }
  ]
}
```

:::

To render this component, you can use `react-dom` as you normally would in a React application, but Epos provides a simpler API. Instead of manually creating root elements and rendering into them, you can just call `epos.render(<App/>)` and Epos will take setup everything automatically:

Now when you open [example.com](https://example.com), you should see "Epos Extension" rendered next to the page's content.

While you can use this approach, Epos provides a simpler API for rendering your app. Instead of manually creating root elements and rendering into them, you can just call `epos.render(<App/>)` and Epos will take care of the rest:

::: code-group

```tsx [src/app.tsx]
import 'epos'

const App = () => {
  return <div>Epos Extension</div>
}

epos.render(<App />) // [!code ++]
```

:::

TODO: _Anatomy_ of DOM structure.

In the previous section we used 'react-dom' to render out React app into the DOM. However, Epos provides a simpler api for rendering. Basically, just call `epos.render(<App/>)` and epos will render your application.

But where will it render the app? Good question! For this, let's take a look at DOM structure that Epos precreates for your project:

<!-- prettier-ignore -->
```html
<!doctype html>
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
  <head>
    ...
  </head>
  <body>
    ...
  </body>
</html>
````

First thing to notice is the `<epos>` tag that wraps everything. This is where Epos injects its runtime and your project's code. It uses custom tag name just for convenience, so it is easier to spot in the DOM, but you can think of it as a regular `<div>`. You can see that `<epos>` is placed outside of `<body>`, this is done to avoid any conflicts with page's content. This is perfectly valid HTML structure and browsers will render content inside `<epos>` the same way they render content inside `<body>`.

Next, inside `<epos>` you can see two important elements: link and script. These are styles and scripts injected by Epos. Styles contain only your project's styles (Epos does not have any styles of its own), while script contains Epos runtime and your project's code bundled together. It's important to note, that URLs for link and script are reverted after the load, so website cannot access them directly which imroves security: the malicious website won't be able to read your extension's code or styles.

Next, you can see a `<div>` with `data-project-name` and `data-project-id` attributes. This is the root element for your project. Epos uses these attributes to identify your project in case you have multiple Epos-based extensions installed.

Finally, inside your project's root element you can see `data-react-root` — the default container used for rendering your app. When you call `epos.render(<App/>)`, Epos will render your React app into this container by default. You can also see a `data-shadow` element that contains a shadow DOM, and inside it there is another container with `data-shadow-react-root` attribute — the default container used for rendering your app into shadow DOM, if you choose to do so.

By default, epos loads styles globally, so they are exposed to the website. If you want to render your app inside shadow DOM to isolate its styles, you need to prefix your styles inside "load" field with `shadow:`

::: code-group

```json [epos.json]
{
  "name": "My Extension",
  "matches": "*://*.example.com/*",
  "load": [
    "example.js",
    // [!code highlight]
    "shadow:example.css"
  ]
}
```

:::

If you have css with `shadow:` prefix, `epos.render(<App/>)` will automatically detect it and render your app inside `data-shadow-react-root` container. Usually this is the desired behavior when using shadow DOM. But if you still want to render your app into default container, you can pass any container to epos.render method: `epos.render(<App/>, container)`.

## DOM

For accessing DOM elements created by Epos, you can use the following epos API:

```ts
// Root element for your project (div with data-project-name)
epos.dom.root

// This is the default container used for rendering (div with data-react-root)
epos.dom.view

// Shadow root element (#shadow-root inside data-shadow element)
epos.dom.shadowRoot

// This is the default container used for rendering if you render inside shadow root (div with data-shadow-react-root)
epos.dom.shadowView
```

Usually you won't need to access these elements directly, because `epos.render` will automatically render your app into the correct container. But if you have custom logic, they may come in handy.

::: code-group

```tsx [src/app.tsx]
import { createRoot } from 'react-dom/client'

const App = () => {
  return <div>Epos Extension</div>
}

// Create root element for React to render into
const div = document.createElement('div')
document.body.append(div)

// Render the app
const root = createRoot(div)
root.render(<App />)
```

:::
