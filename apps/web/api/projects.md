::: warning

This is an AI-generated draft based on the Epos source code. Proper documentation is coming soon.

:::

# epos.projects.\*

`epos.projects` is the project management API.

## Availability

This API is not always present.

It is added only when the project enables it through `options.allowProjectsApi`.

## epos.projects.has()

```ts
epos.projects.has(id: string): Promise<boolean>
```

Checks whether a project exists.

## epos.projects.get()

```ts
epos.projects.get<T extends ProjectQuery>(id: string, query?: T): Promise<Project<T> | null>
```

Gets one project.

### Query fields

- `sources: true` — include source files.
- `assets: true` — include asset blobs.

## epos.projects.list()

```ts
epos.projects.list<T extends ProjectQuery>(query?: T): Promise<Project<T>[]>
```

Lists all projects.

## epos.projects.create()

```ts
epos.projects.create(params: Bundle & Partial<ProjectSettings>): Promise<string>
```

Creates a project from a bundle.

### Notes

- The input bundle contains `spec`, `sources`, and `assets`.
- The current implementation generates the project id for you.
- `debug` and `enabled` can be provided.

## epos.projects.update()

```ts
epos.projects.update(id: string, updates: Partial<Bundle & ProjectSettings>): Promise<void>
```

Updates an existing project.

## epos.projects.remove()

```ts
epos.projects.remove(id: string): Promise<void>
```

Removes a project.

## epos.projects.export()

```ts
epos.projects.export(id: string): Promise<Record<string, Blob>>
```

Builds an export bundle and returns it as a map of file names to blobs.

## epos.projects.watch()

```ts
epos.projects.watch(listener: () => void): void
```

Registers a callback that runs when the project list changes.

### Notes

- This API does not currently return an unsubscribe function.

## epos.projects.fetch()

```ts
epos.projects.fetch(url: string): Promise<Bundle>
```

Fetches a remote project bundle from an `epos.json` URL.

### Notes

- Epos fetches the spec, then fetches all referenced source files and assets relative to that URL.
- The returned value is a bundle object that can be passed to `create()`.

### Example

```ts
const bundle = await epos.projects.fetch('https://example.com/epos.json')
const id = await epos.projects.create(bundle)
```
