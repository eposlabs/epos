import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.js'
import { Badge } from '@/components/ui/badge.js'
import { Button } from '@/components/ui/button.js'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty.js'
import { Item, ItemContent } from '@/components/ui/item.js'
import { Separator } from '@/components/ui/separator.js'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet.js'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar.js'
import { Spinner } from '@/components/ui/spinner.js'
import { Switch } from '@/components/ui/switch.js'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.js'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.js'
import { cn } from '@/lib/utils.js'
import type { Assets, Manifest, ProjectBase, Sources, Spec } from 'epos'
import {
  AlertCircle,
  Download,
  FileCode2,
  FileJson2,
  FolderOpen,
  FolderPlus,
  RefreshCw,
  Trash2,
  Unplug,
} from 'lucide-react'

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
      exportOpen: false,
      activeTab: 'spec' as 'spec' | 'manifest',
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

  async connect(template: Template | null = null) {
    if (this.state.connecting) return
    this.state.connecting = true
    this.state.template = template

    await this.safe(async () => {
      const [handle] = await this.$.utils.safe(() => showDirectoryPicker({ mode: template ? 'readwrite' : 'read' }))
      if (!handle) return

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
    this.state.template = null
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

  private get totalAssetBytes() {
    return this.assets.reduce((sum, asset) => sum + asset.size, 0)
  }

  private get totalSourceBytes() {
    return this.sources.reduce((sum, source) => sum + source.size, 0)
  }

  private get errorCauseText() {
    const cause = this.state.error?.cause
    if (!cause) return null
    return cause instanceof Error ? cause.message : String(cause)
  }

  private formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // MARK: Views
  // ===========================================================================

  View() {
    if (!this.state.ready) return <this.LoadingView />
    return (
      <div className="h-full">
        <Item variant="outline">
          <ItemContent>
            <div className="text-2xl">{this.spec.name}</div>
            <div className="mt-2 flex gap-1">
              <Badge variant="outline">{this.spec.slug}</Badge>
              <Badge variant="outline">v{this.spec.version}</Badge>
              <Badge variant="outline">id:{this.id.slice(0, 8)}</Badge>
            </div>
          </ItemContent>
        </Item>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList variant="line">
            <TabsTrigger value="overview">epos.json</TabsTrigger>
            <TabsTrigger value="analytics">manifest.json</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
          {/* <this.HeaderView /> */}
          {/* {!!this.state.error && <this.ErrorView />} */}
          {/* {this.state.handle ? <this.ConnectedView /> : <this.DisconnectedView />} */}
        </div>
        {/* <this.ExportSheet /> */}
      </div>
    )
  }

  private LoadingView() {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  private HeaderView() {
    return (
      <section className="border">
        <div className="flex flex-col gap-5 p-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={this.state.error ? 'destructive' : this.state.handle ? 'default' : 'outline'}>
                {this.state.error ? 'Error' : this.state.handle ? 'Connected' : 'Disconnected'}
              </Badge>
              <Badge variant="outline">
                {this.state.observers.length} watcher{this.state.observers.length === 1 ? '' : 's'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-semibold tracking-tight">{this.spec.name}</div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{this.spec.slug}</Badge>
                <Badge variant="outline">v{this.spec.version}</Badge>
                <div>ID {this.id.slice(0, 8)}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 xl:max-w-xl xl:justify-end">
            <label className="flex items-center gap-3 text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
              <span>Enabled</span>
              <Switch checked={this.enabled} onCheckedChange={() => this.toggle()} aria-label="Toggle project enabled" />
            </label>
            <label className="flex items-center gap-3 text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
              <span>Debug</span>
              <Switch checked={this.debug} onCheckedChange={() => this.toggleDebug()} aria-label="Toggle project debug" />
            </label>
            <Button variant="outline" onClick={() => this.refresh()} disabled={!this.state.handle || this.state.connecting}>
              <RefreshCw className={cn(this.state.connecting && 'animate-spin')} />
              Refresh
            </Button>
            {this.state.handle ? (
              <Button variant="outline" onClick={() => this.disconnect()}>
                <Unplug />
                Disconnect
              </Button>
            ) : (
              <Button variant="outline" onClick={() => this.connect()} disabled={this.state.connecting}>
                {this.state.connecting ? <Spinner /> : <FolderOpen />}
                Connect Folder
              </Button>
            )}
            <Button variant="outline" onClick={() => (this.state.exportOpen = true)} disabled={!this.state.handle}>
              <Download />
              Export
            </Button>
            <Button variant="destructive" onClick={() => this.remove()}>
              <Trash2 />
              Remove
            </Button>
          </div>
        </div>
      </section>
    )
  }

  private ErrorView() {
    return (
      <Alert variant="destructive">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-1">
            <AlertTitle>{this.state.error?.message || 'Project error'}</AlertTitle>
            {this.errorCauseText && <AlertDescription>{this.errorCauseText}</AlertDescription>}
          </div>
        </div>
      </Alert>
    )
  }

  private DisconnectedView() {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <section className="border">
          <Empty className="items-start p-6 text-left">
            <EmptyHeader className="max-w-none items-start">
              <EmptyMedia variant="icon">
                <FolderOpen />
              </EmptyMedia>
              <EmptyTitle>Connect a project folder</EmptyTitle>
              <EmptyDescription className="max-w-xl text-left">
                Pick an existing folder that contains epos.json and the referenced source files, or scaffold a base template
                into an empty directory.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="max-w-none items-start gap-3 text-left">
              <div className="grid w-full gap-3 md:grid-cols-2">
                <Button onClick={() => this.connect()} disabled={this.state.connecting}>
                  {this.state.connecting && this.state.template === null ? <Spinner /> : <FolderOpen />}
                  Connect Existing Folder
                </Button>
                <Button variant="outline" onClick={() => this.connect('base')} disabled={this.state.connecting}>
                  {this.state.connecting && this.state.template === 'base' ? <Spinner /> : <FolderPlus />}
                  Initialize Base Template
                </Button>
              </div>
              <div className="grid w-full gap-3 border p-4 md:grid-cols-3">
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase">Template</div>
                  <div className="mt-1 text-sm">Base</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase">Creates</div>
                  <div className="mt-1 text-sm">Vite entry, background script, CSS, config</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase">Permission</div>
                  <div className="mt-1 text-sm">Requires folder write access once</div>
                </div>
              </div>
            </EmptyContent>
          </Empty>
        </section>

        <section className="border p-5">
          <div className="text-sm font-medium">Project Snapshot</div>
          <div className="mt-4 grid gap-3">
            <this.StatTile
              label="Targets"
              value={String(this.spec.targets.length)}
              detail="Execution surfaces defined in epos.json"
            />
            <this.StatTile
              label="Assets"
              value={String(this.spec.assets.length)}
              detail="Static files referenced by the project"
            />
            <this.StatTile
              label="Permissions"
              value={String(this.spec.permissions.length)}
              detail="Required extension permissions"
            />
            <this.StatTile
              label="Host Permissions"
              value={String(this.spec.hostPermissions.length)}
              detail="Declared host patterns"
            />
          </div>
        </section>
      </div>
    )
  }

  private ConnectedView() {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.85fr)]">
        <section className="border">
          <div className="flex items-center gap-2 p-4">
            <Button
              variant={this.state.activeTab === 'spec' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => (this.state.activeTab = 'spec')}
            >
              epos.json
            </Button>
            <Button
              variant={this.state.activeTab === 'manifest' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => (this.state.activeTab = 'manifest')}
            >
              manifest.json
            </Button>
          </div>
          <Separator />
          {this.state.activeTab === 'spec' ? (
            <this.JsonPanel
              title="epos.json"
              description="Raw project spec loaded from the connected folder."
              inset={false}
            >
              {this.specText || 'No epos.json loaded'}
            </this.JsonPanel>
          ) : (
            <this.JsonPanel
              title="manifest.json"
              description="Resolved manifest that will be used for export."
              inset={false}
            >
              {JSON.stringify(this.manifest, null, 2)}
            </this.JsonPanel>
          )}
        </section>

        <section className="border">
          <this.FileListView
            title="Sources"
            icon={<FileCode2 className="size-4" />}
            items={this.sources.map(source => ({
              path: source.path,
              detail: `${this.formatBytes(source.size)}${source.path.endsWith('.js') ? (source.minified ? ' • minified' : ' • unminified') : ''}`,
              tone: source.path.endsWith('.js') && !source.minified ? 'warning' : 'default',
            }))}
            emptyText="No sources loaded"
          />
          <Separator />
          <this.FileListView
            title="Assets"
            icon={<FileJson2 className="size-4" />}
            items={this.assets.map(asset => ({ path: asset.path, detail: this.formatBytes(asset.size) }))}
            emptyText="No assets declared"
          />
        </section>
      </div>
    )
  }

  private StatTile({
    label,
    value,
    detail,
    boxed = true,
  }: {
    label: string
    value: string
    detail: string
    boxed?: boolean
  }) {
    return (
      <div className={cn('bg-background p-4', boxed && 'border')}>
        <div className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">{label}</div>
        <div className="mt-2 text-lg font-semibold">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
      </div>
    )
  }

  private FileListView({
    title,
    icon,
    items,
    emptyText,
  }: {
    title: string
    icon: React.ReactNode
    items: { path: string; detail: string; tone?: 'default' | 'warning' }[]
    emptyText: string
  }) {
    return (
      <div className="bg-background">
        <div className="flex items-center gap-2 p-4 text-sm font-medium">
          {icon}
          {title}
          <span className="text-xs font-normal text-muted-foreground">{items.length}</span>
        </div>
        <Separator />
        {items.length === 0 ? (
          <div className="p-4 text-xs text-muted-foreground">{emptyText}</div>
        ) : (
          <div className="max-h-96 overflow-auto">
            {items.map(item => (
              <div key={item.path} className="flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0">
                <div className="min-w-0">
                  <div className="truncate font-mono text-xs">{item.path}</div>
                </div>
                <div
                  className={cn(
                    'shrink-0 text-[11px] text-muted-foreground',
                    item.tone === 'warning' && 'text-amber-700 dark:text-amber-400',
                  )}
                >
                  {item.detail}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  private JsonPanel({
    title,
    description,
    children,
    inset = true,
  }: {
    title: string
    description: string
    children: string
    inset?: boolean
  }) {
    return (
      <section className={cn(inset && 'border')}>
        <div className="p-4">
          <div className="text-sm font-medium">{title}</div>
          <div className="mt-1 text-xs text-muted-foreground">{description}</div>
        </div>
        {inset && <Separator />}
        <pre className="max-h-104 overflow-auto p-4 font-mono text-[11px] leading-5">{children}</pre>
      </section>
    )
  }

  private ExportSheet() {
    return (
      <Sheet open={this.state.exportOpen} onOpenChange={open => (this.state.exportOpen = open)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Export Project</SheetTitle>
            <SheetDescription>
              Review the current manifest, file totals, and source quality before exporting {this.spec.slug}-
              {this.spec.version}.zip.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-auto px-4 pb-4">
            <section className="grid gap-px border bg-border sm:grid-cols-2">
              <this.StatTile
                label="Archive"
                value={`${this.spec.slug}-${this.spec.version}.zip`}
                detail="Generated filename"
                boxed={false}
              />
              <this.StatTile
                label="Manifest Keys"
                value={String(Object.keys(this.manifest ?? {}).length)}
                detail="Resolved manifest entries"
                boxed={false}
              />
              <this.StatTile
                label="Assets"
                value={String(this.assets.length)}
                detail={this.formatBytes(this.totalAssetBytes)}
                boxed={false}
              />
              <this.StatTile
                label="Sources"
                value={String(this.sources.length)}
                detail={this.formatBytes(this.totalSourceBytes)}
                boxed={false}
              />
            </section>

            <this.JsonPanel title="Manifest" description="Resolved manifest payload included in the export archive.">
              {JSON.stringify(this.manifest, null, 2)}
            </this.JsonPanel>

            <section className="border">
              <div className="grid gap-px bg-border lg:grid-cols-2">
                <this.FileListView
                  title="Assets"
                  icon={<FileJson2 className="size-4" />}
                  items={this.assets.map(asset => ({ path: asset.path, detail: this.formatBytes(asset.size) }))}
                  emptyText="No assets will be exported"
                />
                <this.FileListView
                  title="Sources"
                  icon={<FileCode2 className="size-4" />}
                  items={this.sources.map(source => ({
                    path: source.path,
                    detail: `${this.formatBytes(source.size)}${source.path.endsWith('.js') ? (source.minified ? ' • minified' : ' • unminified') : ''}`,
                    tone: source.path.endsWith('.js') && !source.minified ? 'warning' : 'default',
                  }))}
                  emptyText="No sources will be exported"
                />
              </div>
            </section>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => (this.state.exportOpen = false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await this.export()
                this.state.exportOpen = false
              }}
              disabled={!this.state.handle}
            >
              <Download />
              Export Now
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
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
