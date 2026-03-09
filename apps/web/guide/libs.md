# Libs

Epos ships with a small set of built-in libraries. They are available through `epos.libs`, and the Vite plugin can rewrite normal imports to use those built-in versions.

This helps avoid duplicate React or MobX copies and keeps your bundle smaller.

## Vite Setup

If you are using Vite, make sure you use the Epos plugin:

```ts
import { epos } from 'epos/vite'

export default {
  plugins: [epos()],
}
```

With that plugin in place, normal imports such as this:

```ts
import { useState } from 'react'
```

can be resolved to the Epos-provided library version under the hood.

## Available Libraries

The built-in libraries are:

- `react`
- `react-dom`
- `react-dom/client`
- `react/jsx-runtime`
- `mobx`
- `mobx-react-lite`
- `yjs`

You can access them directly through `epos.libs`.

```ts
const { useState } = epos.libs.react
const { reaction } = epos.libs.mobx
```

## When to Use `epos.libs`

For most app code, regular imports are usually nicer:

```ts
import { useState } from 'react'
```

But direct `epos.libs.*` access is useful when:

- you are not using a bundler,
- you want to be explicit about using the built-in copy,
- you are experimenting in a small file or devtools-like environment.

## React Example

```tsx
const { useState } = epos.libs.react

const Counter = () => {
  const [count, setCount] = useState(0)

  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

## MobX Example

```ts
const { reaction } = epos.libs.mobx

const state = await epos.state.connect({ count: 0 })

reaction(
  () => state.count,
  count => console.log('Count changed:', count),
)
```

## Yjs Example

Most projects do not need to use Yjs directly, because Epos already uses it internally for shared state. Still, it is available if you need it.

```ts
const { Doc, applyUpdate } = epos.libs.yjs

const doc = new Doc()

epos.bus.on('yjs:update', (update: number[]) => {
  applyUpdate(doc, new Uint8Array(update))
})
```

## Why This Exists

The goal of `epos.libs` is not to give you more things to learn. It is there to keep the environment consistent.

The most important practical benefit is usually React. When your app and the engine use the same React version, you avoid a whole class of confusing problems.

If you want the exact API shape, see the [Libraries API Reference](/api/libs).
