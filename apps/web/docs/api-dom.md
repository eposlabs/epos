---
outline: [2, 3]
---

# DOM API

The DOM API provides access to pre-created DOM elements that Epos sets up for your project. These elements are useful for rendering content on web pages with proper isolation.

## epos.dom.root

The project's root container element. This is a `<div>` that serves as the main container for all your project's DOM elements.

```ts
epos.dom.root: HTMLDivElement
```

### Attributes

- `data-project-name` - The name of your project
- `data-project-id` - The unique identifier of your project

### Example

```ts
// Access the root element
console.log(epos.dom.root)

// Append custom elements
const customElement = document.createElement('div')
customElement.textContent = 'Hello World'
epos.dom.root.appendChild(customElement)
```

## epos.dom.reactRoot

A pre-created element for React rendering outside of shadow DOM. This is used when you don't need style isolation.

```ts
epos.dom.reactRoot: HTMLDivElement
```

### Attributes

- `data-react-root` - Marks this as a React root container

### Example

```ts
// Manual React rendering (usually epos.render() does this automatically)
import { createRoot } from 'react-dom/client'

const root = createRoot(epos.dom.reactRoot)
root.render(<App />)
```

## epos.dom.shadowRoot

A pre-created shadow DOM root for style isolation. Use this when you want to prevent your styles from affecting the host page and vice versa.

```ts
epos.dom.shadowRoot: ShadowRoot
```

### Example

```ts
// Append elements to shadow DOM
const element = document.createElement('div')
element.textContent = 'Isolated content'
epos.dom.shadowRoot.appendChild(element)

// Add styles that won't leak to the page
const style = document.createElement('style')
style.textContent = 'div { color: red; }'
epos.dom.shadowRoot.appendChild(style)
```

## epos.dom.shadowReactRoot

A pre-created element inside the shadow DOM specifically for React rendering. This is used when you have shadow CSS defined in your project.

```ts
epos.dom.shadowReactRoot: HTMLDivElement
```

### Attributes

- `data-react-root` - Marks this as a React root container

### Example

```ts
// React rendering in shadow DOM (usually epos.render() does this automatically)
import { createRoot } from 'react-dom/client'

const root = createRoot(epos.dom.shadowReactRoot)
root.render(<App />)
```

## DOM Hierarchy

The DOM structure that Epos creates looks like this:

```html
<epos>
  <div data-project-name="my-project" data-project-id="abc123">
    <!-- epos.dom.root -->

    <div data-react-root="">
      <!-- epos.dom.reactRoot -->
      <!-- React content renders here (if no shadow CSS) -->
    </div>

    <div data-shadow="">
      #shadow-root
      <!-- epos.dom.shadowRoot -->
      <link rel="stylesheet" href="blob:..." />
      <!-- Your shadow CSS -->

      <div data-react-root="">
        <!-- epos.dom.shadowReactRoot -->
        <!-- React content renders here (if shadow CSS exists) -->
      </div>
    </div>
  </div>
</epos>
```

## Shadow CSS Configuration

When you define shadow CSS in your `epos.json`, Epos automatically:

1. Creates a shadow DOM with `epos.dom.shadowRoot`
2. Injects your CSS as a linked stylesheet
3. Uses `epos.dom.shadowReactRoot` for React rendering
4. Hoists `@property` rules to the document root (they don't work in shadow DOM)

::: tip
Use `epos.render()` instead of accessing these elements directly. It automatically selects the correct root based on your project configuration.
:::

## Use Cases

### Manual DOM Manipulation

```ts
// Add a custom element
const banner = document.createElement('div')
banner.className = 'my-banner'
banner.textContent = 'Extension loaded'
epos.dom.root.appendChild(banner)
```

### Style Isolation

```ts
// Add isolated styles
const style = document.createElement('style')
style.textContent = `
  .my-widget {
    color: blue;
    font-size: 16px;
  }
`
epos.dom.shadowRoot.appendChild(style)

// Add widget
const widget = document.createElement('div')
widget.className = 'my-widget'
widget.textContent = 'This style is isolated'
epos.dom.shadowRoot.appendChild(widget)
```

### Custom React Root

```ts
// Create a custom portal
import { createPortal } from 'react-dom'

const MyPortal = ({ children }) => {
  return createPortal(children, epos.dom.shadowRoot)
}
```
