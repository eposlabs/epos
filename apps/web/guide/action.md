# Action

The `action` field controls what happens when the user clicks your extension icon in the browser toolbar.

For many extensions, this click opens a popup or a side panel. But if your project does not use either of those, Epos can still give that click a meaning.

## When `action` Matters

If your project has a `<popup>` target, clicking the icon opens the popup.

If your project has a `<sidePanel>` target, clicking the icon opens the side panel.

In those cases, the `action` field is not used.

`action` is only relevant when your project does not define a popup or side panel.

## `action: true`

When you set `action` to `true`, clicking the toolbar icon sends a special `:action` bus event to your project.

::: code-group

```json [epos.json]
{
  "name": "My Extension",
  "action": true,
  "targets": [
    {
      "matches": "<background>",
      "load": ["dist/background.js"]
    }
  ]
}
```

```ts [src/background.ts]
epos.bus.on(':action', tab => {
  console.log('Action clicked from tab:', tab?.id)
})
```

:::

This is useful when clicking the icon should run some code instead of opening UI.

A common example is toggling a feature on the current tab.

## `action` as a URL

Instead of `true`, you can also set `action` to a URL.

```json
{
  "name": "My Extension",
  "action": "https://example.com/help"
}
```

When the icon is clicked, Epos opens that URL in a new tab.

This can be useful for simple tools that should open a dashboard, documentation page, or onboarding screen.

## Choosing Between Popup, Side Panel, and Action

A simple rule:

- Use `<popup>` when you want a small UI attached to the icon.
- Use `<sidePanel>` when you want more room and a persistent UI.
- Use `action: true` when a click should trigger logic.
- Use `action: "https://..."` when a click should open a page.

If you already have a popup or side panel, you usually do not need `action` at all.

## Notes

- `action` accepts only `true` or a valid URL string.
- If your project has a popup or side panel target, `action` is ignored.
- The `:action` event fits naturally with `epos.bus`, so background logic is often the best place to handle it.
