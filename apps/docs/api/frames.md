::: warning

This is an AI-generated draft based on the Epos source code.

:::

# epos.frames.\*

`epos.frames` manages project-owned background frames.

These frames are ordinary iframes created by the engine and tracked by project id.

## epos.frames.create()

```ts
epos.frames.create(url: string, attrs?: Record<string, string | number>): Promise<string>
```

Creates a frame and returns its generated id.

### Notes

- `attrs` is a map of `<iframe>` attributes to apply to the created frame.
- `src` and `name` are managed by Epos and ignored if provided.
- The frame gets a generated name and project metadata attributes.
- Epos also sets default iframe attributes such as width, height, sandbox, and allow rules.
- Before the frame is created, Epos adds a network rule that removes `X-Frame-Options` for the target hostname.

## epos.frames.remove()

```ts
epos.frames.remove(id: string): Promise<void>
```

Removes a frame created by this project.

### Notes

- This also removes the temporary network rule that was added for the frame.

## epos.frames.has()

```ts
epos.frames.has(id: string): Promise<boolean>
```

Checks whether a frame exists.

## epos.frames.list()

```ts
epos.frames.list(): Promise<{ id: string; name: string; url: string }[]>
```

Lists all frames currently open for the project.

### Example

```ts
const frameId = await epos.frames.create('https://example.com')

const frames = await epos.frames.list()
console.log(frames)

await epos.frames.remove(frameId)
```
