import { Button } from '@/components/ui/button.js'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar.js'
import { cn } from '@/lib/utils.js'
import type { Assets, Manifest, ProjectBase, Sources, Spec } from 'epos'

export type Template = 'base'

export class Project extends gl.Unit {
  spec: Spec
  manifest: Manifest
  debug: boolean
  enabled: boolean
  specText: string | null = null
  assets: { path: string; size: number }[] = []
  sources: { path: string; size: number; minified?: boolean }[] = []

  constructor(parent: gl.Unit, params: ProjectBase) {
    super(parent)
    this.id = params.id
    this.spec = params.spec
    this.manifest = params.manifest
    this.debug = params.debug
    this.enabled = params.enabled
  }

  get state() {
    return {
      ready: false,
      connecting: false,
      error: null as Error | null,
      handle: null as FileSystemDirectoryHandle | null,
      observers: [] as FileSystemObserver[],
      template: null as Template | null,
    }
  }

  get inert() {
    return {
      templates: {
        base: [
          { path: 'public/epos.svg', optional: true },
          { path: 'src/background.ts' },
          { path: 'src/main.css' },
          { path: 'src/main.tsx' },
          { path: '.gitignore', optional: true },
          { path: 'epos.json' },
          { path: 'package.json' },
          { path: 'tsconfig.json', optional: true },
          { path: 'vite.config.ts' },
        ],
      },
    }
  }

  get $projects() {
    return this.closest(gl.Projects)!
  }

  get selected() {
    return this.$projects.selectedId === this.id
  }

  /** List of file paths used by the project. */
  get paths() {
    const assetPaths = this.spec.assets
    const resourcePaths = this.spec.targets.flatMap(target => target.resources.map(resource => resource.path))
    return ['epos.json', ...assetPaths, ...resourcePaths]
  }

  // MARK: Life Cycle
  // ============================================================================

  async init() {
    this.refresh = this.$.utils.enqueue(this.refresh)
    const handle = await this.$.idb.get<FileSystemDirectoryHandle>('epos-shell', 'handles', this.id)
    if (handle) await this.setHandle(handle)
    this.state.ready = true
  }

  async dispose() {
    await this.setHandle(null)
    this.unobserve()
  }

  // MARK: Actions
  // ============================================================================

  update(updates: Omit<ProjectBase, 'id'>) {
    this.spec = updates.spec
    this.manifest = updates.manifest
    this.debug = updates.debug
    this.enabled = updates.enabled
  }

  select() {
    this.$projects.selectedId = this.id
  }

  async toggle() {
    await epos.projects.update(this.id, { enabled: !this.enabled })
  }

  async toggleDebug() {
    await epos.projects.update(this.id, { debug: !this.debug })
  }

  async remove() {
    await epos.projects.remove(this.id)
  }

  async connect() {
    if (this.state.connecting) return
    this.state.connecting = true

    await this.safe(async () => {
      const [handle] = await this.$.utils.safe(() => showDirectoryPicker({ mode: 'read' }))
      if (!handle) return

      const template = this.state.template
      if (template) {
        const files = this.inert.templates[template]
        for (const file of files) {
          const exists = await this.$.utils.fs.fileExists(handle, file.path)
          if (exists && !file.optional) {
            throw new Error(`Failed to initialize from "${template}" template: ${file.path} already exists`)
          }
          if (!exists) {
            const blob = await epos.assets.get(`/templates/${template}/${file.path}`)
            if (!blob) throw this.never()
            await this.$.utils.fs.writeFile(handle, file.path, blob)
          }
        }
      }

      await this.setHandle(handle)
    })

    this.state.connecting = false
  }

  async disconnect() {
    if (!this.state.handle) return
    this.state.error = null
    await this.setHandle(null)
  }

  async refresh() {
    await this.safe(async () => {
      this.state.error = null

      // Read epos.json
      const [specText, readError] = await this.$.utils.safe(() => this.readFileAsText('epos.json'))
      if (readError) throw new Error('Failed to read epos.json', { cause: readError })
      this.specText = specText

      // Parse epos.json
      const [spec, parseError] = this.$.utils.safeSync(() => this.$.libs.parseSpecJson(specText))
      if (parseError) throw new Error('Failed to parse epos.json', { cause: parseError })

      // Read assets
      this.assets = []
      const assets: Assets = {}
      for (const path of spec.assets) {
        const file = await this.readFile(path)
        assets[path] = file
        this.assets.push({ path, size: file.size })
      }

      // Read sources
      this.sources = []
      const sources: Sources = {}
      for (const target of spec.targets) {
        for (const resource of target.resources) {
          if (sources[resource.path]) continue
          const file = await this.readFile(resource.path)
          const content = await file.text()
          sources[resource.path] = content
          this.sources.push({
            path: resource.path,
            size: file.size,
            ...(resource.path.endsWith('.js') && { minified: this.isMinifiedJs(content) }),
          })
        }
      }

      // Update project
      await epos.projects.update(this.id, { spec, sources, assets })
    })
  }

  async export() {
    const unminifiedJsSource = this.sources.find(source => source.path.endsWith('.js') && !source.minified)
    if (unminifiedJsSource) {
      const ok = confirm(`Unminified: ${unminifiedJsSource.path}. Export anyway?`)
      if (!ok) return
    }

    const files = await epos.projects.export(this.id)
    const zip = await this.$.utils.zip(files)
    const url = URL.createObjectURL(zip)
    const filename = `${this.spec.slug}-${this.spec.version}.zip`
    await epos.browser.downloads.download({ url, filename })
    URL.revokeObjectURL(url)
  }

  // MARK: Internals
  // ============================================================================

  private async setHandle(handle: FileSystemDirectoryHandle | null) {
    if (handle) {
      await this.$.idb.set('epos-shell', 'handles', this.id, handle)
      this.state.handle = handle
      await this.refresh()
      this.observe()
    } else {
      await this.$.idb.delete('epos-shell', 'handles', this.id)
      this.state.handle = null
      this.unobserve()
    }
  }

  private async observe() {
    if (!this.state.handle) return
    if (this.state.observers.length > 0) return

    // Use micro delay to batch multiple changes
    let timer = -1

    for (const path of this.paths) {
      const handle = await this.getFileHandle(path)

      const observer = new FileSystemObserver(() => {
        clearTimeout(timer)
        timer = setTimeout(() => this.refresh())
      })

      observer.observe(handle)
      this.state.observers.push(observer)
    }
  }

  private unobserve() {
    if (this.state.observers.length === 0) return
    for (const observer of this.state.observers) observer.disconnect()
    this.state.observers = []
  }

  private async readFile(path: string) {
    const handle = await this.getFileHandle(path)
    return await handle.getFile()
  }

  private async readFileAsText(path: string) {
    const file = await this.readFile(path)
    return await file.text()
  }

  private async getFileHandle(path: string) {
    if (!this.state.handle) throw new Error('Project directory is not connected')
    const handle = await this.$.utils.fs.getFileHandle(this.state.handle, path)
    if (!handle) throw new Error(`File not found: ${path}`)
    return handle
  }

  private isMinifiedJs(js: string) {
    const source = js.trim()
    const lines = source.split(/\r?\n/)
    const nonEmptyLines = lines.filter(line => line.trim().length > 0)
    if (nonEmptyLines.length === 0) return false

    const lengths = nonEmptyLines.map(line => line.length)
    const totalLength = lengths.reduce((sum, length) => sum + length, 0)
    const averageLineLength = totalLength / nonEmptyLines.length
    const maxLineLength = Math.max(...lengths)
    const longLineRatio = nonEmptyLines.filter(line => line.length >= 160).length / nonEmptyLines.length
    const isIndentedOrClosingLine = (line: string) => /^( {2,}|\t)/.test(line) || /^\s*[}\])]/.test(line)
    const indentedLineRatio = nonEmptyLines.filter(isIndentedOrClosingLine).length / nonEmptyLines.length
    const whitespaceRatio = (source.match(/\s/g)?.length ?? 0) / source.length
    const punctuationRatio = (source.match(/[;{},]/g)?.length ?? 0) / source.length

    if (nonEmptyLines.length === 1) return maxLineLength >= 500 || whitespaceRatio < 0.12
    if (maxLineLength >= 1000) return true

    let score = 0
    if (averageLineLength >= 140) score += 2
    if (longLineRatio >= 0.5) score += 2
    if (maxLineLength >= 320) score += 1
    if (whitespaceRatio <= 0.18) score += 1
    if (indentedLineRatio <= 0.1) score += 1
    if (punctuationRatio >= 0.18) score += 1

    return score >= 4
  }

  private async safe(fn: Fn) {
    const [result, error] = await this.$.utils.safe(() => fn())
    if (error) this.state.error = error
    return [result, error] as const
  }

  // MARK: Views
  // ===========================================================================

  View() {
    return <this.DevView />
  }

  private DevView() {
    return (
      <div className="m-4">
        <pre className="border border-black p-4 text-sm">
          {JSON.stringify(
            {
              id: this.id,
              name: this.spec.name,
              slug: this.spec.slug,
              enabled: this.enabled,
              debug: this.debug,
              connected: !!this.state.handle,
              ready: this.state.ready,
              template: this.state.template,
              observers: this.state.observers.length,
              error: this.state.error ? this.state.error.message : null,
              assets: this.assets,
              sources: this.sources,
            },
            null,
            2,
          )}
        </pre>
        <div className="mt-4 flex gap-1">
          <Button onClick={() => this.toggle()}>toggle</Button>
          <Button onClick={() => this.toggleDebug()}>toggle debug</Button>
          <Button onClick={() => this.remove()}>remove</Button>
          <Button onClick={() => this.connect()}>connect</Button>
          <Button onClick={() => this.disconnect()}>disconnect</Button>
          <Button onClick={() => this.export()}>export</Button>
          <Button onClick={() => this.refresh()}>refresh</Button>
        </div>
      </div>
    )
  }

  SidebarView() {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton isActive={this.selected} onClick={() => this.select()}>
          <div
            className={cn(
              'ml-0.5 size-1 rounded-full bg-green-500',
              this.state.error && 'bg-red-500',
              !this.enabled && 'bg-gray-500',
              !this.state.handle && 'bg-gray-500',
            )}
          />
          <div className="truncate">{this.spec.name}</div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  // MARK: Versioner
  // ============================================================================

  static versioner: any = {}
}
