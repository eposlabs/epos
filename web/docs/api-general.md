# General API

Most of the Epos APIs are organized into namespaces. For example, state APIs are available under `epos.state.*`, but several general-purpose APIs live directly under `epos.*`. These APIs provide core functionality used across all parts of your project — network requests, browser API access, DOM integration, and rendering.

## `epos.fetch`

Same as the standard [`fetch`](https://developer.mozilla.org/docs/Web/API/fetch), but allows **cross-origin requests**, even from contexts where CORS would normally block them.

**Syntax:**

```js
epos.fetch(url, init?)
```

**Example:**

```js
const response = await epos.fetch('https://example.com/')
const html = await response.text()
console.log(html)
```

::: details How does this work?
Epos routes requests through its background service, which has the necessary extension permissions to bypass CORS restrictions.
The API remains fully compatible with the native `fetch` interface.
:::

## `epos.browser`

One-to-one implementation of the [Chrome Extensions API](https://developer.chrome.com/docs/extensions/reference/api).
Normally, `chrome.*` APIs are accessible only from special extension pages. Epos exposes the same functionality everywhere via `epos.browser.*`.

**Syntax:**

```js
epos.browser.*
```

**Example:**

```js
const tabs = await epos.browser.tabs.query({})
await epos.browser.tabs.remove(tabs[0].id)
```

## `epos.element`

Epos creates a special `<epos/>` HTML element and places it **before** the `<head/>` tag.
Although non-standard, this ensures that Epos’s scripts and styles stay isolated from the rest of the page.
Inside this element, Epos creates a dedicated `<div>` for your project, available as `epos.element`.

```html
<!doctype html>
<html>
  <epos>
    <!-- JS and CSS injected via Epos -->
    <script src="..."></script>
    <link rel="stylesheet" href="..." />

    <!-- This is epos.element -->
    <div project="your-project-name">...</div>
    <!-- [!code ++] -->
  </epos>
  <head>
    ...
  </head>
  <body>
    ...
  </body>
</html>
```

You can manually render into it:

```js
epos.element.innerHTML = '<h1>Hello, Epos!</h1>'
```

In most cases, you’ll use [`epos.render`](#epos-render) instead, which automatically mounts your app into this element.

## `epos.render`

Renders a React component (or any JSX element) into the DOM.
If no container is provided, Epos uses a **default root container** inside `epos.element`.
When a container is passed, rendering happens inside that element instead.

**Syntax:**

```js
epos.render(jsx, container?)
```

**Examples:**

```js
// Render into default container
epos.render(<App />)

// Render into a specific container
epos.render(<App />, document.getElementById('root'))
```

::: details What is a "default root container"?
By default, Epos creates a `<div root/>` inside `epos.element`:

```html
<epos>
  ...
  <div project="your-project-name">
    <div root></div>
    <!-- [!code ++] -->
  </div>
</epos>
```

If `mode: "shadow"` is set in your `epos.json`, this container is placed inside a Shadow DOM:

```html
<epos>
  ...
  <div project="your-project-name">
    #shadow-root (open)
    <div root></div>
    <!-- [!code ++] -->
  </div>
</epos>
```

:::

---

## `epos.component`

Wraps functional React components so they automatically re-render when parts of the connected Epos state change (see [State](/docs/api-state) section).
This is similar to `observer` from `mobx-react-lite`, but integrated with Epos’s state system.

**Syntax:**

```js
epos.component(ComponentFunction)
```

**Example**

```js
const state = await epos.state.connect({ username: 'World' })

const Title = epos.component(props => {
  return (
    <h1>
      {props.greeting || 'Hello'}, {state.username}
    </h1>
  )
})
```
