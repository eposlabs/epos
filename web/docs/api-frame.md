# Frame

The **Frame API** lets you manage background frames — hidden iframes running in the background of your extension.  
Frames are useful for running isolated scripts, maintaining hidden state, or hosting background UI such as invisible canvases or offscreen views.

## `epos.frame.open`

Opens (or reuses) a background frame.  
Each frame has a unique `name`, and if a frame with the same name already exists, it won’t be created again.

```ts
epos.frame.open(name: string, url: string, attributes?: Record<string, unknown>): Promise<void>
```

```js
await epos.frame.open('preview', 'frame:./preview.html')
```

## `epos.frame.close`

Closes a background frame by name.

**Usage**

```ts
epos.frame.close(name: string): Promise<void>
```

**Example**

```js
await epos.frame.close('preview')
```

## `epos.frame.exists`

Checks whether a background frame with the given name currently exists.

**Usage**

```ts
epos.frame.exists(name: string): Promise<boolean>
```

**Example**

```js
if (await epos.frame.exists('preview')) {
  console.log('Preview frame is active')
}
```

## `epos.frame.list`

Returns a list of all currently open background frames, including their names and URLs.

**Usage**

```ts
epos.frame.list(): Promise<{ name: string; url: string }[]>
```

**Example**

```js
const frames = await epos.frame.list()
console.table(frames)
```

---

Frames opened through this API stay active in the background until explicitly closed.
They can communicate with other parts of your extension using the [Bus API](/docs/api-bus).
