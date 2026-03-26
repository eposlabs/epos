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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.js'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty.js'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.js'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar.js'
import { Spinner } from '@/components/ui/spinner.js'
import { Switch } from '@/components/ui/switch.js'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.js'
import { TooltipWrap } from '@/components/ui/tooltip.js'
import { cn } from '@/lib/utils.js'
import type { Assets, Manifest, ProjectBase, Sources, Spec } from 'epos'
import { AlertTriangle, BookText, File, Folder, FolderOpen, Package, RefreshCw, Trash2 } from 'lucide-react'

export type TabId = 'spec' | 'manifest' | 'files' | 'settings'
export type Template = 'base'
export type TemplateChoice = 'empty' | Template

export class Project extends gl.Unit {
  spec: Spec
  manifest: Manifest
  debug: boolean
  enabled: boolean
  specText: string | null = null
  assets: { path: string; size: number }[] = []
  jsSources: { path: string; size: number; minified: boolean }[] = []
  cssSources: { path: string; size: number }[] = []
  setup = new gl.ProjectSetup(this)
  watcher = new gl.ProjectWatcher(this)

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
      error: null as { title: string; message: string } | null,
      handle: null as FileSystemDirectoryHandle | null,
      updatedAt: null as Date | null,
      selectedTabId: 'spec' as TabId,
      showRemoveDialog: false,
      showExportDialog: false,
    }
  }

  get $projects() {
    return this.closest(gl.Projects)!
  }

  get selected() {
    return this.$projects.selectedId === this.id
  }

  get connected() {
    return !!this.state.handle
  }

  get status() {
    if (!this.enabled) return 'disabled'
    if (!this.connected) return 'disconnected'
    if (this.state.error) return 'error'
    return 'connected'
  }

  /** List of file paths used by the project. */
  get paths() {
    const assetPaths = this.spec.assets
    const resourcePaths = this.spec.targets.flatMap(target => target.resources.map(resource => resource.path))
    return ['epos.json', ...assetPaths, ...resourcePaths]
  }

  async init() {
    this.reload = this.$.utils.enqueue(this.reload)
    const handle = await this.$.idb.get<FileSystemDirectoryHandle>('epos-shell', 'handles', this.id)
    if (handle) await this.setHandle(handle)
    this.state.ready = true
  }

  async dispose() {
    await this.setHandle(null)
  }

  update(updates: Omit<ProjectBase, 'id'>) {
    this.spec = updates.spec
    this.manifest = updates.manifest
    this.debug = updates.debug
    this.enabled = updates.enabled
    this.state.updatedAt = new Date()
    this.watcher.restart()
  }

  select() {
    this.$projects.selectedId = this.id
  }

  async setEnabled(value: boolean) {
    await epos.projects.update(this.id, { enabled: value })
  }

  async setDebug(value: boolean) {
    await epos.projects.update(this.id, { debug: value })
  }

  async remove() {
    await epos.projects.remove(this.id)
    const firstProject = this.$projects.list[0]
    if (firstProject) firstProject.select()
  }

  toggleRemoveDialog() {
    if (!this.connected) return
    this.state.showRemoveDialog = !this.state.showRemoveDialog
  }

  toggleExportDialog() {
    if (!this.connected) return
    this.state.showExportDialog = !this.state.showExportDialog
  }

  selectTab(tabId: TabId) {
    if (!this.connected) return
    this.state.selectedTabId = tabId
  }

  async connect() {
    const [handle] = await this.$.utils.safe(() => showDirectoryPicker({ mode: 'readwrite' }))
    if (handle) await this.setHandle(handle)
  }

  async disconnect() {
    if (!this.state.handle) return
    this.state.error = null
    await this.setHandle(null)
  }

  async reload() {
    this.state.error = null

    // Read epos.json
    const [specText, readError] = await this.$.utils.safe(() => this.readFileAsText('epos.json'))
    if (readError) {
      this.specText = null
      return this.setError('Failed to read epos.json', readError)
    }

    // Save spec text
    this.specText = specText

    // Parse epos.json
    const [spec, parseError] = this.$.utils.safeSync(() => this.$.libs.parseSpecJson(specText))
    if (parseError) return this.setError('Failed to parse epos.json', parseError)

    // Read assets
    this.assets = []
    const assets: Assets = {}
    for (const path of spec.assets) {
      const [file, readError] = await this.$.utils.safe(() => this.readFile(path))
      if (readError) return this.setError(`Failed to read asset: ${path}`, readError)
      assets[path] = file
      this.assets.push({ path, size: file.size })
    }

    // Read sources
    this.jsSources = []
    this.cssSources = []
    const sources: Sources = {}
    for (const target of spec.targets) {
      for (const resource of target.resources) {
        if (sources[resource.path]) continue
        const [file, readError] = await this.$.utils.safe(() => this.readFile(resource.path))
        if (readError) return this.setError(`Failed to read file: ${resource.path}`, readError)
        const [content, parseError] = await this.$.utils.safe(() => file.text())
        if (parseError) return this.setError(`Failed to read file: ${resource.path}`, parseError)
        sources[resource.path] = content
        if (resource.path.endsWith('.js')) {
          this.jsSources.push({ path: resource.path, size: file.size, minified: this.isMinifiedJs(content) })
        } else if (resource.path.endsWith('.css')) {
          this.cssSources.push({ path: resource.path, size: file.size })
        }
      }
    }

    // Update project
    const [, updateError] = await this.$.utils.safe(() => epos.projects.update(this.id, { spec, sources, assets }))
    if (updateError) return this.setError('Failed to update', updateError)
  }

  async export() {
    const files = await epos.projects.export(this.id)
    const zip = await this.$.utils.zip(files)
    const url = URL.createObjectURL(zip)
    const filename = `${this.spec.slug}-${this.spec.version}.zip`
    await epos.browser.downloads.download({ url, filename })
    URL.revokeObjectURL(url)
  }

  private setError(title: string, error: Error) {
    this.state.error = { title, message: error.message }
  }

  private async setHandle(handle: FileSystemDirectoryHandle | null) {
    if (handle) {
      await this.$.idb.set('epos-shell', 'handles', this.id, handle)
      this.state.handle = handle
      await this.reload()
      this.watcher.start()
    } else {
      await this.$.idb.delete('epos-shell', 'handles', this.id)
      this.state.handle = null
      this.watcher.stop()
    }
  }

  private async readFile(path: string) {
    const handle = await this.getFileHandle(path)
    return await handle.getFile()
  }

  private async readFileAsText(path: string) {
    const file = await this.readFile(path)
    return await file.text()
  }

  async getFileHandle(path: string) {
    if (!this.state.handle) throw new Error('Project is not connected to a local folder')
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

  // MARK: Views
  // ===========================================================================

  View() {
    return (
      <div className="mx-auto flex h-full w-full max-w-180 flex-col">
        <this.MainView />
        <this.LoadingView />
        <this.RemoveDialogView />
        <this.ExportDialogView />
      </div>
    )
  }

  SidebarView() {
    return (
      <SidebarMenuItem className="relative flex h-9! items-center rounded-lg hover:bg-sidebar-accent">
        <SidebarMenuButton isActive={this.selected} onClick={() => this.select()} className="h-full">
          <div
            className={cn(
              'mx-0.5 size-1.25 shrink-0 rounded-full',
              this.state.error && 'bg-destructive',
              !this.state.error && 'bg-green-600 dark:bg-green-300',
              !this.connected && 'bg-amber-600 dark:bg-amber-300',
              !this.enabled && 'bg-muted-foreground',
            )}
          />
          <div className="truncate pr-9 font-normal">{this.spec.name}</div>
        </SidebarMenuButton>
        <TooltipWrap text={this.enabled ? 'Enabled' : 'Disabled'}>
          <div className="absolute right-2 h-4.5">
            <Switch checked={this.enabled} onCheckedChange={value => this.setEnabled(value)} size="sm" />
          </div>
        </TooltipWrap>
      </SidebarMenuItem>
    )
  }

  private MainView() {
    if (!this.state.ready) return null
    return (
      <div className="flex size-full flex-col gap-4 p-4">
        <this.HeaderView />
        <this.ErrorView />
        <this.TabsView />
        <this.ContentView />
      </div>
    )
  }

  private HeaderView() {
    const dot = (className?: string) => <div className={cn('mr-0.5 size-1 rounded-full bg-current', className)} />

    return (
      <div className="flex w-full flex-col gap-1.5 border-b pb-4">
        <div className="flex justify-between">
          {/* Name */}
          <div className="text-xl/[32px]">{this.spec.name}</div>

          {/* Actions */}
          {this.connected && (
            <div className="flex gap-2">
              {this.enabled && (
                <TooltipWrap text="Reload project">
                  <Button variant="outline" onClick={() => this.reload()}>
                    <RefreshCw />
                  </Button>
                </TooltipWrap>
              )}
              <Button variant="default" onClick={() => this.toggleExportDialog()}>
                <Package />
                Export
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          {/* Badges */}
          <div className="flex gap-1.5 font-mono select-none">
            {this.status === 'error' && <Badge variant="destructive">{dot()} error</Badge>}
            {this.status === 'connected' && <Badge variant="green">{dot()} live</Badge>}
            {this.status === 'disconnected' && <Badge variant="amber">{dot()} not connected</Badge>}
            {this.status === 'disabled' && <Badge variant="secondary">{dot('bg-muted-foreground')} disabled</Badge>}
            <Badge variant="secondary">{this.spec.slug}</Badge>
            <Badge variant="secondary">v{this.spec.version}</Badge>
          </div>

          {/* Timestamp */}
          {(() => {
            if (!this.state.updatedAt) return null
            const hh = this.state.updatedAt.getHours().toString().padStart(2, '0')
            const mm = this.state.updatedAt.getMinutes().toString().padStart(2, '0')
            const ss = this.state.updatedAt.getSeconds().toString().padStart(2, '0')
            const ms = this.state.updatedAt.getMilliseconds().toString().padStart(3, '0')
            return (
              <div className="font-mono text-xs/[20px] text-muted-foreground">
                Updated at {hh}:{mm}:{ss}:{ms}
              </div>
            )
          })()}
        </div>
      </div>
    )
  }

  private ErrorView() {
    if (!this.enabled) return null
    if (!this.connected) return null
    if (!this.state.error) return null
    return (
      <div className="flex border-l-3 border-destructive bg-destructive/10 py-2 pr-4 pl-2.5 text-sm text-destructive">
        <AlertTriangle className="relative top-0.5 mr-2.5 size-4 shrink-0" />
        <div>
          <div className="font-medium">{this.state.error.title}</div>
          {this.state.error.message && <div className="mt-1">{this.state.error.message}</div>}
        </div>
      </div>
    )
  }

  private TabsView() {
    if (!this.connected) return null
    return (
      <Tabs
        value={this.state.selectedTabId}
        onValueChange={tabId => this.selectTab(tabId as TabId)}
        className="select-none"
      >
        <TabsList variant="default" className="gap-1">
          <TabsTrigger value="spec" className="_pb-4">
            epos.json
          </TabsTrigger>
          <TabsTrigger value="manifest" className="_pb-4">
            manifest.json
          </TabsTrigger>
          <TabsTrigger value="files" className="_pb-4">
            Files
          </TabsTrigger>
          <TabsTrigger value="settings" className="_pb-4">
            Settings
          </TabsTrigger>
        </TabsList>
      </Tabs>
    )
  }

  private ContentView() {
    return (
      <div className="overflow-auto rounded-xl border bg-card">
        <this.setup.View />
        <this.SpecView />
        <this.ManifestView />
        <this.FilesView />
        <this.SettingsView />
      </div>
    )
  }

  private SpecView() {
    if (!this.connected) return null
    if (this.state.selectedTabId !== 'spec') return null
    if (this.specText) return <this.JsonView json={this.specText} />
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>File Not Found</EmptyTitle>
          <EmptyDescription>epos.json file is missing from the project directory.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  private ManifestView() {
    if (!this.connected) return null
    if (this.state.selectedTabId !== 'manifest') return null
    return <this.JsonView json={JSON.stringify(this.manifest, null, 2)} title="generated based on the epos.json" />
  }

  private FilesView() {
    if (!this.connected) return null
    if (this.state.selectedTabId !== 'files') return null
    const allFiles = [...this.jsSources, ...this.cssSources, ...this.assets]
    const uniqueFiles = [...new Map(allFiles.map(file => [file.path, file])).values()]
    return (
      <div className="px-0 py-0 text-sm">
        {uniqueFiles.map(file => (
          <div key={file.path} className="flex items-center p-4 not-last:border-b">
            <File className="mr-2 size-3.5" />
            <div>{file.path}</div>
            <div className="ml-auto font-mono">{(file.size / 1024).toFixed(2)} KB</div>
          </div>
        ))}
        {uniqueFiles.length > 1 && (
          <div className="flex items-center p-4">
            <div className="text-muted-foreground">Total {uniqueFiles.length} files</div>
            <div className="ml-auto font-mono text-muted-foreground">
              {(uniqueFiles.reduce((sum, file) => sum + file.size, 0) / 1024).toFixed(2)} KB
            </div>
          </div>
        )}
      </div>
    )
  }

  private SettingsView() {
    if (!this.state.handle) return null
    if (this.state.selectedTabId !== 'settings') return null

    return (
      <div className="flex flex-col">
        {/* Connected Folder */}
        <div className="flex justify-between border-b p-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <FolderOpen className="size-3.5" />
              Connected Folder
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Local folder where project files are located.</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => this.connect()} className="gap-1.5">
              <Folder />
              <div className="max-w-30 truncate">{this.state.handle.name}</div>
            </Button>
            <Button variant="outline" size="sm" onClick={() => this.disconnect()}>
              Disconnect
            </Button>
          </div>
        </div>

        {/* Library Builds */}
        <div className="flex justify-between border-b p-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <BookText className="size-3.5" />
              Library Builds
            </div>
            <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
              <div>Which builds of built-in libs to use (React, MobX, and others).</div>
              <div>This option does not affect the exported bundle.</div>
            </div>
          </div>
          <div>
            <Select
              value={this.debug ? 'development' : 'production'}
              onValueChange={value => this.setDebug(value === 'development')}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectGroup>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Delete */}
        <div className="flex justify-between p-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Trash2 className="size-3.5" />
              Delete Project
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Files on your computer won't be removed.</div>
          </div>
          <div>
            <Button variant="destructive" size="sm" onClick={() => this.toggleRemoveDialog()}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    )
  }

  private LoadingView() {
    if (this.state.ready) return null
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  private RemoveDialogView() {
    if (!this.state.showRemoveDialog) return null
    return (
      <AlertDialog open={true} onOpenChange={() => this.toggleRemoveDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2 className="size-4.5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete {this.spec.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project. The files on your computer will not be removed.
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

  private ExportDialogView() {
    if (!this.state.showExportDialog) return null
    const unminifiedJsSource = this.jsSources.find(source => !source.minified)

    return (
      <Dialog open={true} onOpenChange={() => this.toggleExportDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Project</DialogTitle>
            <DialogDescription>Generate a standalone extension ZIP bundle.</DialogDescription>
            {unminifiedJsSource && (
              <Alert variant="warning" className="mt-1">
                <AlertTriangle />
                <AlertTitle>Unminified code detected</AlertTitle>
                <AlertDescription className="wrap-anywhere">
                  <span className="font-medium">{unminifiedJsSource.path}</span> is not minified. Probably your project is
                  not built for production.
                </AlertDescription>
              </Alert>
            )}
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="default" onClick={() => this.export()}>
              {unminifiedJsSource ? 'Export Anyway' : 'Export'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  private JsonView({ json, title }: { json: string; title?: string }) {
    return (
      <div className="relative size-full text-sm">
        {title && (
          <div
            className={cn(
              'absolute top-0 right-0 rounded-bl-xl border-b border-l bg-neutral-100 px-2.5 py-1.5 font-mono text-xs',
              'text-muted-foreground dark:bg-neutral-800',
            )}
          >
            {title}
          </div>
        )}
        <div className="size-full overflow-auto">
          <div className="h-fit w-fit pt-4 pr-8 pb-8 pl-4">
            <this.$.highlight.JsonView value={json} />
          </div>
        </div>
      </div>
    )
  }

  // MARK: Versioner
  // ============================================================================

  static versioner: any = {
    1() {
      this.state.selectedTabId = 'spec'
    },
    2() {
      this.setup = new gl.ProjectSetup(this)
    },
    3() {
      this.watcher = new gl.ProjectWatcher(this)
    },
    4() {
      delete this.selectedTabId
    },
  }
}
