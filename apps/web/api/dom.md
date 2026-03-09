# epos.dom.\*

`epos.dom` exposes the DOM nodes that Epos creates for the current project.

You usually do not need these directly, because `epos.render()` already uses the right container by default. They are useful when you need custom rendering or low-level DOM work.

## epos.dom.root

```ts
epos.dom.root: HTMLDivElement
```

The root project container appended under the page-level `<epos>` element.

### Notes

- Epos adds `data-project-name`, `data-project-id`, and `data-epos` attributes to this node.
- `epos.dom.view` and the shadow host both live inside this root.

## epos.dom.view

```ts
epos.dom.view: HTMLDivElement
```

The normal light-DOM view container.

### Notes

- Epos adds a `data-view` attribute to this node.
- `epos.render()` uses this container by default when the project is not rendering into Shadow DOM.

## epos.dom.shadowRoot

```ts
epos.dom.shadowRoot: ShadowRoot
```

The pre-created open Shadow DOM used by the project.

### Notes

- The Shadow DOM exists even if you do not render into it.
- When the project has shadow CSS, Epos injects that CSS into this Shadow DOM.
- `@property` rules from shadow CSS are hoisted to the root DOM because they do not work correctly inside Shadow DOM.

## epos.dom.shadowView

```ts
epos.dom.shadowView: HTMLDivElement
```

The default render container inside `epos.dom.shadowRoot`.

### Notes

- Epos adds a `data-shadow-view` attribute to this node.
- `epos.render()` uses this container by default when the project is set up to render with shadow CSS.

## Structure

The generated structure looks like this:

```html
<epos>
  <div data-project-name="My Extension" data-project-id="..." data-epos>
    <div data-view></div>
    <div data-shadow>
      #shadow-root
      <div data-shadow-view></div>
    </div>
  </div>
</epos>
```

## Example

```ts
const badge = document.createElement('div')
badge.textContent = 'Injected by Epos'

epos.dom.root.append(badge)
```
