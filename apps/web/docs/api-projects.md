---
outline: [2, 3]
---

# Projects API

The projects API allows you to programmatically manage Epos projects. This is an advanced feature that must be explicitly enabled in your `epos.json`.

::: warning
The projects API is disabled by default. To enable it, set `config.allowProjectsApi: true` in your `epos.json`.
:::

## epos.projects.has()

Check if a project with the given ID exists.

```ts
epos.projects.has(id: string): Promise<boolean>
```

### Parameters

- `id` - The project ID to check

### Returns

A Promise that resolves to `true` if the project exists, `false` otherwise.

### Example

```ts
const exists = await epos.projects.has('my-extension')
console.log('Project exists:', exists)
```

## epos.projects.get()

Get a project by ID with optional query parameters to include sources and assets.

```ts
epos.projects.get<T extends ProjectQuery>(
  id: string,
  query?: T
): Promise<Project<T> | null>
```

### Parameters

- `id` - The project ID
- `query` - Optional query object
  - `sources` - If `true`, includes project source code
  - `assets` - If `true`, includes project assets

### Returns

A Promise that resolves to the project object, or `null` if not found.

### Example

```ts
// Get basic project info
const project = await epos.projects.get('my-extension')
console.log(project.spec.name)
console.log(project.spec.version)
console.log(project.enabled)

// Get project with sources
const projectWithSources = await epos.projects.get('my-extension', {
  sources: true,
})
console.log(projectWithSources.sources)
// { 'index.js': '...', 'app.tsx': '...' }

// Get project with assets
const projectWithAssets = await epos.projects.get('my-extension', {
  assets: true,
})
console.log(projectWithAssets.assets)
// { 'logo.png': Blob, 'data.json': Blob }

// Get everything
const fullProject = await epos.projects.get('my-extension', {
  sources: true,
  assets: true,
})
```

## epos.projects.list()

Get a list of all projects with optional query parameters.

```ts
epos.projects.list<T extends ProjectQuery>(
  query?: T
): Promise<Project<T>[]>
```

### Parameters

- `query` - Optional query object
  - `sources` - If `true`, includes project source code
  - `assets` - If `true`, includes project assets

### Returns

A Promise that resolves to an array of project objects.

### Example

```ts
// Get all projects (basic info only)
const projects = await epos.projects.list()
projects.forEach(project => {
  console.log(project.spec.name, project.enabled)
})

// Get all projects with sources
const projectsWithSources = await epos.projects.list({
  sources: true,
})

// Get all projects with everything
const fullProjects = await epos.projects.list({
  sources: true,
  assets: true,
})
```

## epos.projects.create()

Create a new project.

```ts
epos.projects.create<T extends string>(
  params: Bundle & Partial<{ id: T } & ProjectSettings>
): Promise<T>
```

### Parameters

- `params` - Project creation parameters
  - `spec` - The Epos specification (from `epos.json`)
  - `sources` - Object mapping file paths to source code strings
  - `assets` - Object mapping file paths to Blob objects
  - `id` - Optional custom project ID
  - `debug` - Optional debug mode flag
  - `enabled` - Optional enabled flag

### Returns

A Promise that resolves to the created project's ID.

### Example

```ts
const projectId = await epos.projects.create({
  spec: {
    name: 'My Extension',
    slug: 'my-extension',
    version: '1.0.0',
    description: 'A sample extension',
    icon: null,
    action: null,
    popup: { width: 400, height: 600 },
    config: {
      preloadAssets: false,
      allowProjectsApi: false,
      allowMissingModels: false,
    },
    assets: [],
    targets: [
      {
        matches: [{ context: 'locus', value: 'popup' }],
        resources: [{ type: 'js', path: 'popup.js' }],
      },
    ],
    permissions: {
      required: [],
      optional: [],
    },
    manifest: null,
  },
  sources: {
    'popup.js': 'epos.render(<h1>Hello World</h1>)',
  },
  assets: {},
  debug: false,
  enabled: true,
})

console.log('Created project:', projectId)
```

## epos.projects.update()

Update an existing project.

```ts
epos.projects.update(
  id: string,
  updates: Partial<Bundle & ProjectSettings>
): Promise<void>
```

### Parameters

- `id` - The project ID to update
- `updates` - Partial project data to update
  - `spec` - Updated specification
  - `sources` - Updated source files
  - `assets` - Updated assets
  - `debug` - Updated debug flag
  - `enabled` - Updated enabled flag

### Example

```ts
// Update project settings
await epos.projects.update('my-extension', {
  debug: true,
  enabled: false,
})

// Update source code
await epos.projects.update('my-extension', {
  sources: {
    'popup.js': 'epos.render(<h1>Updated!</h1>)',
  },
})

// Update spec
await epos.projects.update('my-extension', {
  spec: {
    ...currentSpec,
    version: '1.1.0',
  },
})
```

## epos.projects.remove()

Delete a project permanently.

```ts
epos.projects.remove(id: string): Promise<void>
```

### Parameters

- `id` - The project ID to remove

### Example

```ts
await epos.projects.remove('old-extension')
console.log('Project removed')
```

::: warning
This permanently deletes the project and all its data. This action cannot be undone.
:::

## epos.projects.export()

Export a project as a collection of files (Blobs).

```ts
epos.projects.export(id: string): Promise<Record<string, Blob>>
```

### Parameters

- `id` - The project ID to export

### Returns

A Promise that resolves to an object mapping file paths to Blob objects.

### Example

```ts
const files = await epos.projects.export('my-extension')

// Download all files
for (const [path, blob] of Object.entries(files)) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = path
  a.click()
  URL.revokeObjectURL(url)
}

// Or create a ZIP
import JSZip from 'jszip'

const zip = new JSZip()
for (const [path, blob] of Object.entries(files)) {
  zip.file(path, blob)
}

const zipBlob = await zip.generateAsync({ type: 'blob' })
// Download or save zipBlob
```

## epos.projects.watch()

Watch for any project changes (create, update, remove).

```ts
epos.projects.watch(listener: () => void): void
```

### Parameters

- `listener` - Function to call when any project changes

### Example

```ts
// Listen for changes
epos.projects.watch(() => {
  console.log('Projects changed, reloading list...')
  loadProjects()
})

async function loadProjects() {
  const projects = await epos.projects.list()
  // Update UI
}
```

## epos.projects.fetch()

Fetch a project bundle from a remote URL (must point to an `epos.json` file).

```ts
epos.projects.fetch(url: string): Promise<Bundle>
```

### Parameters

- `url` - URL to the `epos.json` file

### Returns

A Promise that resolves to a bundle containing spec, sources, and assets.

### Example

```ts
// Fetch from GitHub
const bundle = await epos.projects.fetch('https://raw.githubusercontent.com/user/repo/main/epos.json')

console.log('Fetched project:', bundle.spec.name)
console.log('Sources:', Object.keys(bundle.sources))
console.log('Assets:', Object.keys(bundle.assets))

// Install the fetched project
const projectId = await epos.projects.create(bundle)
console.log('Installed:', projectId)
```

## Use Cases

### Project Manager Extension

```ts
// List all projects
const ProjectList: React.FC = epos.component(() => {
  const [projects, setProjects] = React.useState([])

  const load = async () => {
    const list = await epos.projects.list()
    setProjects(list)
  }

  React.useEffect(() => {
    load()
    epos.projects.watch(load)
  }, [])

  const toggleEnabled = async (id: string, enabled: boolean) => {
    await epos.projects.update(id, { enabled: !enabled })
  }

  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>
          <h3>{project.spec.name}</h3>
          <p>Version: {project.spec.version}</p>
          <button onClick={() => toggleEnabled(project.id, project.enabled)}>
            {project.enabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      ))}
    </div>
  )
})
```

### Project Store

```ts
// Fetch and install from a store
async function installFromStore(storeUrl: string) {
  try {
    const bundle = await epos.projects.fetch(storeUrl)
    const projectId = await epos.projects.create({
      ...bundle,
      enabled: true,
    })

    console.log('Installed:', bundle.spec.name)
    return projectId
  } catch (error) {
    console.error('Installation failed:', error)
    throw error
  }
}

// Usage
await installFromStore('https://store.example.com/extensions/my-extension/epos.json')
```

### Backup and Restore

```ts
// Backup all projects
async function backupAllProjects() {
  const projects = await epos.projects.list({
    sources: true,
    assets: true,
  })

  const backup = {
    timestamp: Date.now(),
    projects: projects,
  }

  const blob = new Blob([JSON.stringify(backup)], {
    type: 'application/json',
  })

  // Save blob
  return blob
}

// Restore from backup
async function restoreFromBackup(backupBlob: Blob) {
  const text = await backupBlob.text()
  const backup = JSON.parse(text)

  for (const project of backup.projects) {
    await epos.projects.create({
      id: project.id,
      spec: project.spec,
      sources: project.sources,
      assets: project.assets,
      debug: project.debug,
      enabled: project.enabled,
    })
  }
}
```

### Development Tools

```ts
// Hot reload a project during development
async function hotReload(projectId: string, newSources: Record<string, string>) {
  await epos.projects.update(projectId, {
    sources: newSources,
  })

  console.log('Project reloaded')
}

// Toggle debug mode
async function toggleDebug(projectId: string) {
  const project = await epos.projects.get(projectId)
  if (project) {
    await epos.projects.update(projectId, {
      debug: !project.debug,
    })
  }
}
```

## Project Structure

A project object has the following structure:

```ts
interface Project {
  id: string // Unique identifier
  debug: boolean // Debug mode flag
  enabled: boolean // Enabled flag
  spec: Spec // Epos specification
  manifest: Manifest // Generated Chrome manifest
  sources?: Record<string, string> // Source files (if requested)
  assets?: Record<string, Blob> // Asset files (if requested)
}
```

::: tip
Use the projects API to build extension managers, stores, or development tools on top of Epos.
:::

::: warning
The projects API is powerful but should be used carefully. Always validate data before creating or updating projects.
:::
