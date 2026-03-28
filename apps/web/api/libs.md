::: warning

This is an AI-generated draft based on the Epos source code. Proper documentation is coming soon.

:::

# epos.libs.\*

`epos.libs` exposes the runtime copies of the libraries used by Epos.

```ts
epos.libs = {
  mobx,
  mobxReactLite,
  react,
  reactDom,
  reactDomClient,
  reactJsxRuntime,
  yjs,
}
```

## Why it exists

- It gives you the same library copies that the engine already uses.
- It avoids loading a second copy of React or MobX in small setups.
- It is useful when you are not using a bundler.

## epos.libs.mobx

```ts
epos.libs.mobx: typeof mobx
```

## epos.libs.mobxReactLite

```ts
epos.libs.mobxReactLite: typeof mobxReactLite
```

## epos.libs.react

```ts
epos.libs.react: typeof react
```

## epos.libs.reactDom

```ts
epos.libs.reactDom: typeof reactDom
```

## epos.libs.reactDomClient

```ts
epos.libs.reactDomClient: typeof reactDomClient
```

## epos.libs.reactJsxRuntime

```ts
epos.libs.reactJsxRuntime: typeof reactJsxRuntime
```

## epos.libs.yjs

```ts
epos.libs.yjs: typeof yjs
```

## Example

```ts
const { useState } = epos.libs.react
const { reaction } = epos.libs.mobx
```

````

## TypeScript Support

All libraries have full TypeScript support:

```ts
import type { FC, ReactNode } from 'react'
import type { IObservableArray } from 'mobx'
import type { Doc, Map as YMap } from 'yjs'

const MyComponent: FC<{ children: ReactNode }> = ({ children }) => {
  return <div>{children}</div>
}

const observable: IObservableArray<string> = epos.libs.mobx.observable.array([])

const doc: Doc = new epos.libs.yjs.Doc()
const ymap: YMap<any> = doc.getMap('data')
````

::: tip
Using `epos.libs` instead of installing packages separately keeps your extension lightweight and ensures compatibility with Epos's internal systems.
:::

::: info
The libraries are already loaded and available globally. You don't need to import or install them.
:::
