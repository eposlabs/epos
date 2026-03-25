// if (template) {
//   const files = this.inert.templates[template]
//   for (const file of files) {
//     const exists = await this.$.utils.fs.fileExists(handle, file.path)
//     if (exists && !file.optional) {
//       throw new Error(`Failed to initialize from "${template}" template: ${file.path} already exists`)
//     }
//     if (!exists) {
//       const blob = await epos.assets.get(`/templates/${template}/${file.path}`)
//       if (!blob) throw this.never()
//       await this.$.utils.fs.writeFile(handle, file.path, blob)
//     }
//   }
// }
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.js'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.js'
import { Badge } from '@/components/ui/badge.js'
import { Button } from '@/components/ui/button.js'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty.js'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.js'
import { Separator } from '@/components/ui/separator.js'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar.js'
import { Spinner } from '@/components/ui/spinner.js'
import { Switch } from '@/components/ui/switch.js'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.js'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.js'
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
  Package,
  Trash,
  Trash2,
  Unplug,
} from 'lucide-react'

export type Template = 'base'
export type TemplateChoice = 'empty' | Template

export class ProjectOLD extends gl.Unit {
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
      template: 'empty' as TemplateChoice,
      connectingTemplate: null as TemplateChoice | null,
      exportConfirmOpen: false,
      activeTab: 'spec' as 'spec' | 'manifest',
      showRemoveDialog: false,
      showExportDialog: false,
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

  toggleRemoveDialog() {
    this.state.showRemoveDialog = !this.state.showRemoveDialog
  }

  toggleExportDialog() {
    this.state.showExportDialog = !this.state.showExportDialog
  }

  async connect(template: Template | null = null) {
    if (this.state.connecting) return
    this.state.connecting = true
    this.state.connectingTemplate = template ?? 'empty'

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
    this.state.connectingTemplate = null
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

  async requestExport() {
    if (this.unminifiedSources.length > 0) {
      this.state.exportConfirmOpen = true
      return
    }

    await this.export()
  }

  async export() {
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

  private get unminifiedSources() {
    return this.sources.filter(source => source.path.endsWith('.js') && !source.minified)
  }

  private get selectedTemplate() {
    return this.state.template === 'empty' ? null : this.state.template
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
    return (
      <div className="flex h-full flex-col">
        <this.LoadingView />
        <this.DeleteDialogView />
        <this.MainView />
        {/* <this.HeaderView /> */}
        {/* <this.BodyView /> */}
        {/* <this.FooterView /> */}
        {/* <this.ExportDialog /> */}
        {/* <this.HeaderView /> */}
        {/* <this.HeaderView /> */}
        {/* {!!this.state.error && <this.ErrorView />} */}
        {/* <div className="min-h-0 flex-1">{this.state.handle ? <this.ConnectedView /> : <this.DisconnectedView />}</div> */}
        {/* <this.FooterView /> */}
      </div>
    )
  }

  private MainView() {
    if (!this.state.ready) return null

    return (
      <div className="flex w-full items-center p-4">
        <this.HeaderView />
      </div>
    )
  }

  private HeaderView() {
    const onRemoveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (e.shiftKey) {
        this.remove()
      } else {
        this.toggleRemoveDialog()
      }
    }

    return (
      <div className="flex w-full">
        <div className="flex flex-col gap-2">
          <div className="text-xl">{this.spec.name}</div>
          <div className="flex gap-2">
            <Badge variant="secondary">{this.spec.slug}</Badge>
            <Badge variant="secondary">v{this.spec.version}</Badge>
          </div>
        </div>
        <div className="ml-auto flex gap-3">
          <Button variant="outline" onClick={onRemoveClick}>
            <Trash2 />
          </Button>
          <Button variant="default" className="ml-auto gap-2 pr-3">
            <Package />
            Export
          </Button>
        </div>
      </div>
    )
  }

  private DeleteDialogView() {
    if (!this.state.showRemoveDialog) return null
    return (
      <AlertDialog open={true} onOpenChange={() => this.toggleRemoveDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2 className="size-4.5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this project. The project files on your computer will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => this.remove()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  private ExportDialogView() {}

  private LoadingView() {
    if (this.state.ready) return null
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  private HeaderView2() {
    return (
      <section className="rounded-xl border">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-2">
              <div className="text-xl font-semibold tracking-tight sm:text-2xl">{this.spec.name}</div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{this.spec.slug}</Badge>
                <Badge variant="outline">v{this.spec.version}</Badge>
                <Badge variant={this.state.handle ? 'default' : 'outline'}>
                  {this.state.handle ? 'connected' : 'disconnected'}
                </Badge>
                {this.state.error && <Badge variant="destructive">error</Badge>}
                <Badge variant="outline">
                  {this.spec.targets.length} target{this.spec.targets.length === 1 ? '' : 's'}
                </Badge>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">id {this.id.slice(0, 8)}</div>
          </div>
        </div>
      </section>
    )
  }

  private ErrorView() {
    return (
      <Alert variant="destructive">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 shrink-0" />
          <div className="flex flex-col gap-1">
            <AlertTitle>{this.state.error?.message || 'Project error'}</AlertTitle>
            {this.errorCauseText && <AlertDescription>{this.errorCauseText}</AlertDescription>}
          </div>
        </div>
      </Alert>
    )
  }

  private DisconnectedView() {
    const isConnecting = this.state.connecting
    const selectedTemplateLabel = this.state.template === 'empty' ? 'Empty' : 'Base'
    const selectedTemplateDescription =
      this.state.template === 'empty'
        ? 'Connect an existing folder without creating files.'
        : 'Initialize the selected folder with the base template before connecting it.'

    return (
      <section className="rounded-xl border">
        <Empty className="items-start p-6 text-left">
          <EmptyHeader className="max-w-none items-start">
            <EmptyMedia variant="icon">
              <FolderOpen />
            </EmptyMedia>
            <EmptyTitle>Connect a project folder</EmptyTitle>
            <EmptyDescription className="max-w-2xl text-left">
              Select a template and connect a folder for this project. Use Empty for an existing folder or Base to scaffold
              the minimal template first.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="max-w-none items-start gap-4 text-left">
            <div className="flex w-full flex-col gap-3 md:flex-row md:items-end">
              <div className="flex w-full max-w-xs flex-col gap-2">
                <div className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">Template</div>
                <Select
                  value={this.state.template}
                  onValueChange={value => (this.state.template = value as TemplateChoice)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="empty">Empty</SelectItem>
                      <SelectItem value="base">Base</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => this.connect(this.selectedTemplate)} disabled={isConnecting}>
                {isConnecting ? (
                  <Spinner data-icon="inline-start" />
                ) : this.state.template === 'empty' ? (
                  <FolderOpen data-icon="inline-start" />
                ) : (
                  <FolderPlus data-icon="inline-start" />
                )}
                Connect Folder
              </Button>
            </div>

            <div className="grid w-full gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{selectedTemplateLabel}</Badge>
                  {this.state.template === 'base' && <Badge variant="outline">writes files</Badge>}
                </div>
                <div className="mt-3 text-sm text-muted-foreground">{selectedTemplateDescription}</div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <this.StatTile label="Targets" value={String(this.spec.targets.length)} detail="Declared in epos.json" />
                <this.StatTile label="Assets" value={String(this.spec.assets.length)} detail="Static files" />
                <this.StatTile
                  label="Permissions"
                  value={String(this.spec.permissions.length + this.spec.hostPermissions.length)}
                  detail="Extension + host permissions"
                />
              </div>
            </div>

            <div className="grid w-full gap-3 border p-4 md:grid-cols-3">
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase">Template</div>
                <div className="mt-1 text-sm">{selectedTemplateLabel}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase">Behavior</div>
                <div className="mt-1 text-sm">
                  {this.state.template === 'empty' ? 'Read existing files' : 'Create minimal project files'}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase">Permission</div>
                <div className="mt-1 text-sm">
                  {this.state.template === 'empty' ? 'Read access' : 'Read and write access once'}
                </div>
              </div>
            </div>
          </EmptyContent>
        </Empty>
      </section>
    )
  }

  private ConnectedView() {
    return (
      <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.95fr)]">
        <section className="flex min-h-0 flex-col rounded-xl border">
          <Tabs
            value={this.state.activeTab}
            onValueChange={value => (this.state.activeTab = value as 'spec' | 'manifest')}
            className="min-h-0 flex-1 gap-0"
          >
            <div className="border-b px-4 pt-4">
              <TabsList variant="line">
                <TabsTrigger value="spec">epos.json</TabsTrigger>
                <TabsTrigger value="manifest">manifest.json</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="spec" className="mt-0 min-h-0 flex-1">
              <this.JsonPanel description="Raw project spec loaded from the connected folder.">
                {this.specText || 'No epos.json loaded'}
              </this.JsonPanel>
            </TabsContent>

            <TabsContent value="manifest" className="mt-0 min-h-0 flex-1">
              <this.JsonPanel description="Resolved manifest that will be exported.">
                {JSON.stringify(this.manifest, null, 2)}
              </this.JsonPanel>
            </TabsContent>
          </Tabs>
        </section>

        <section className="flex min-h-0 flex-col rounded-xl border">
          <this.FileTableView
            title="Sources"
            icon={<FileCode2 />}
            count={this.sources.length}
            totalBytes={this.totalSourceBytes}
            emptyText="No sources loaded"
            rows={this.sources.map(source => ({
              path: source.path,
              size: source.size,
              status: source.path.endsWith('.js') ? (source.minified ? 'minified' : 'unminified') : 'source',
            }))}
            showStatus
          />
          <Separator />
          <this.FileTableView
            title="Assets"
            icon={<FileJson2 />}
            count={this.assets.length}
            totalBytes={this.totalAssetBytes}
            emptyText="No assets declared"
            rows={this.assets.map(asset => ({ path: asset.path, size: asset.size }))}
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
      <div className={cn('min-w-32 rounded-lg bg-background p-4', boxed && 'border')}>
        <div className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">{label}</div>
        <div className="mt-2 text-lg font-semibold">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
      </div>
    )
  }

  private FileTableView({
    title,
    icon,
    count,
    totalBytes,
    rows,
    emptyText,
    showStatus = false,
  }: {
    title: string
    icon: React.ReactNode
    count: number
    totalBytes: number
    rows: { path: string; size: number; status?: string }[]
    emptyText: string
    showStatus?: boolean
  }) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            {icon}
            {title}
            <Badge variant="outline">{count}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">{this.formatBytes(totalBytes)}</div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Path</TableHead>
                <TableHead className="w-24 text-right">Size</TableHead>
                {showStatus && <TableHead className="w-32">State</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showStatus ? 3 : 2} className="py-6 text-center text-muted-foreground">
                    {emptyText}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(row => (
                  <TableRow key={row.path}>
                    <TableCell className="max-w-0 whitespace-normal">
                      <div className="font-mono text-xs break-all text-foreground/80">{row.path}</div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{this.formatBytes(row.size)}</TableCell>
                    {showStatus && (
                      <TableCell>
                        <Badge variant={row.status === 'unminified' ? 'secondary' : 'outline'}>{row.status}</Badge>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  private JsonPanel({ description, children }: { description: string; children: string }) {
    return (
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="border-b p-4 text-xs text-muted-foreground">{description}</div>
        <pre className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[11px] leading-5">{children}</pre>
      </section>
    )
  }

  private FooterView() {
    return (
      <section className="rounded-xl border">
        <div className="flex flex-col gap-4 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">Connected Folder</div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={this.state.handle ? 'default' : 'outline'}>
                {this.state.handle ? 'connected' : 'disconnected'}
              </Badge>
              <div className="max-w-full truncate text-sm text-muted-foreground">
                {this.state.handle?.name || 'No folder connected'}
              </div>
            </div>
            {this.state.handle && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => this.connect()} disabled={this.state.connecting}>
                  {this.state.connecting ? <Spinner data-icon="inline-start" /> : <FolderOpen data-icon="inline-start" />}
                  Connect Another
                </Button>
                <Button variant="outline" size="sm" onClick={() => this.disconnect()}>
                  <Unplug data-icon="inline-start" />
                  Disconnect
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Enabled</span>
              <Switch checked={this.enabled} onCheckedChange={() => this.toggle()} aria-label="Toggle project enabled" />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Debug</span>
              <Switch checked={this.debug} onCheckedChange={() => this.toggleDebug()} aria-label="Toggle project debug" />
            </label>
            <Button variant="outline" onClick={() => this.requestExport()} disabled={!this.state.handle}>
              <Download data-icon="inline-start" />
              Export
            </Button>
            <Button variant="destructive" onClick={() => this.remove()}>
              <Trash2 data-icon="inline-start" />
              Remove
            </Button>
          </div>
        </div>
      </section>
    )
  }

  private ExportConfirmDialog() {
    const previewSources = this.unminifiedSources.slice(0, 3)

    return (
      <AlertDialog open={this.state.exportConfirmOpen} onOpenChange={open => (this.state.exportConfirmOpen = open)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertCircle />
            </AlertDialogMedia>
            <AlertDialogTitle>Export with unminified sources?</AlertDialogTitle>
            <AlertDialogDescription>
              {this.unminifiedSources.length === 1
                ? 'One JavaScript source appears to be unminified. The archive can still be exported.'
                : `${this.unminifiedSources.length} JavaScript sources appear to be unminified. The archive can still be exported.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">Detected sources</div>
            <div className="mt-2 flex flex-col gap-1 font-mono">
              {previewSources.map(source => (
                <div key={source.path}>{source.path}</div>
              ))}
              {this.unminifiedSources.length > previewSources.length && (
                <div>+ {this.unminifiedSources.length - previewSources.length} more</div>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void this.export()}>Export</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  SidebarView() {
    const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      this.select()
    }

    return (
      <SidebarMenuItem>
        <a
          href="#"
          onClick={onClick}
          className={cn(
            'flex cursor-default items-center rounded-lg p-2 hover:bg-sidebar-accent',
            this.selected && 'bg-sidebar-accent',
          )}
        >
          <div
            className={cn(
              'mr-2 ml-0.5 size-1.25 rounded-full bg-primary',
              this.state.error && 'bg-destructive',
              (!this.enabled || !this.state.handle) && 'bg-muted-foreground',
            )}
          />
          <div className="truncate font-normal">{this.spec.name}</div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="ml-auto" onClick={e => e.preventDefault()}>
                <Switch checked={this.enabled} onCheckedChange={() => this.toggle()} size="sm" />
              </div>
            </TooltipTrigger>
            <TooltipContent>{this.enabled ? 'Disable' : 'Enable'}</TooltipContent>
          </Tooltip>
        </a>
      </SidebarMenuItem>
    )
  }

  // MARK: Versioner
  // ============================================================================

  static versioner: any = {}
}
