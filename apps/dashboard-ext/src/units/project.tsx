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
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert.js'
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
import { AlertTriangle, Blocks, File, Folder, FolderOpen, Package, RefreshCw, Trash2 } from 'lucide-react'

export type TabId = 'spec' | 'manifest' | 'files' | 'settings'

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
      error: null as { name: string; message: string | null } | null,
      handle: null as FileSystemDirectoryHandle | null,
      updatedAt: null as Date | null,
      selectedTabId: 'spec' as TabId,
      showDeleteDialog: false,
      showExportDialog: false,
      exporting: false,
    }
  }

  get $projects() {
    return this.closest(gl.Projects)!
  }

  get selected() {
    return this.$projects.selectedId === this.id
  }

  async init() {
    this.reload = this.$.utils.enqueue(this.reload)
    const handle = await this.$.idb.get<FileSystemDirectoryHandle>('dashboard', 'handles', this.id)
    if (handle) this.useHandle(handle)
    this.state.ready = true
  }

  async dispose() {
    await this.$.idb.delete('dashboard', 'handles', this.id)
    this.watcher.stopGlobalObserver()
    this.watcher.stopFileObservers()
  }

  update(updates: Omit<ProjectBase, 'id'>) {
    this.spec = updates.spec
    this.manifest = updates.manifest
    this.debug = updates.debug
    this.enabled = updates.enabled
    this.state.updatedAt = new Date()
  }

  select() {
    this.$projects.selectedId = this.id
  }

  async setEnabled(value: boolean) {
    await epos.projects.update(this.id, { enabled: value })
    if (value) await this.reload()
  }

  async setDebug(value: boolean) {
    await epos.projects.update(this.id, { debug: value })
  }

  async delete() {
    await epos.projects.remove(this.id)
    const firstProject = this.$projects.list[0]
    if (firstProject) firstProject.select()
  }

  toggleDeleteDialog() {
    if (!this.setup.completed) return
    this.state.showDeleteDialog = !this.state.showDeleteDialog
  }

  toggleExportDialog() {
    if (!this.setup.completed) return
    this.state.showExportDialog = !this.state.showExportDialog
  }

  selectTab(tabId: TabId) {
    if (!this.setup.completed) return
    this.state.selectedTabId = tabId
  }

  async connect() {
    if (!window.showDirectoryPicker) return this.showFileSystemUnavailableToast()
    const [handle, error] = await this.$.utils.safe(() => showDirectoryPicker({ mode: 'readwrite' }))
    if (error?.name === 'NotAllowedError') return this.showFileSystemNotAllowedToast()
    if (handle) await this.useHandle(handle)
  }

  async reload(force = false) {
    if (!force && !this.setup.completed) return

    this.state.error = null
    this.watcher.stopGlobalObserver()
    this.watcher.stopFileObservers()

    await this.watcher.startGlobalObserver()

    // Read epos.json
    const [specText, readError] = await this.$.utils.safe(() => this.readFileAsText('epos.json'))
    if (readError) return this.setError('Failed to read epos.json', readError)

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
      const [, observerError] = await this.$.utils.safe(() => this.watcher.startFileObserver(path))
      if (observerError) return this.setError(`Failed to start file observer for: ${path}`, observerError)
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
        const [, observerError] = await this.$.utils.safe(() => this.watcher.startFileObserver(resource.path))
        if (observerError) return this.setError(`Failed to start file observer for: ${resource.path}`, observerError)
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
    if (this.state.exporting) return
    this.state.exporting = true
    const files = await epos.projects.export(this.id)
    const zip = await this.$.utils.zip(files)
    const url = URL.createObjectURL(zip)
    const filename = `${this.spec.slug === 'dashboard' ? 'epos' : this.spec.slug}-${this.spec.version}.zip`
    await epos.browser.downloads.download({ url, filename })
    URL.revokeObjectURL(url)
    this.state.exporting = false
    this.state.showExportDialog = false
  }

  private async useHandle(handle: FileSystemDirectoryHandle) {
    await this.$.idb.set('dashboard', 'handles', this.id, handle)
    this.state.handle = handle

    const access = await handle.queryPermission({ mode: 'readwrite' })
    if (access !== 'granted') {
      this.setError('FOLDER_ACCESS_REVOKED')
      return
    }

    this.watcher.stopGlobalObserver()
    await this.watcher.startGlobalObserver()
    await this.reload()
  }

  private setError(name: string, error?: Error) {
    this.state.error = { name, message: error?.message ?? null }
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
    const lines = js.split(/\r?\n/)
    const avgLineLength = js.length / lines.length

    const spaceCount = (js.match(/ /g) || []).length
    const spaceRatio = spaceCount / js.length

    const isLongLine = avgLineLength > 250
    const hasFewSpaces = spaceRatio < 0.05

    return isLongLine || hasFewSpaces
  }

  private showFileSystemUnavailableToast() {
    const aboutFlags = (
      <a
        target="_blank"
        onClick={e => {
          e.preventDefault()
          epos.browser.tabs.create({ url: 'about://flags/#file-system-access-api' })
        }}
        className="cursor-pointer underline underline-offset-4"
      >
        about://flags
      </a>
    )

    this.$.toast.error('File System API unavailable', {
      description: (
        <ol className="mt-1 flex list-inside list-decimal flex-col gap-1.5">
          <li>Open {aboutFlags}</li>
          <li>Enable File System Access API</li>
        </ol>
      ),
    })
  }

  private showFileSystemNotAllowedToast() {
    this.$.toast.error('File system access disabled', {
      description: 'You have file system access disabled in your browser settings. Please enable it to continue.',
    })
  }

  // MARK: Views
  // ===========================================================================

  View() {
    // @ts-ignore
    if (this.dev) return <this.DevView />

    return (
      <div className="mx-auto min-h-full w-full max-w-project">
        {this.state.ready ? <this.MainView /> : <this.LoadingView />}
        <this.DeleteDialogView />
        <this.ExportDialogView />
      </div>
    )
  }

  SidebarView() {
    return (
      <SidebarMenuItem className="relative flex h-9! items-center rounded-lg hover:bg-sidebar-accent">
        {/* Status + Name */}
        <SidebarMenuButton isActive={this.selected} onClick={() => this.select()} className="h-full">
          <div
            className={cn(
              'mx-0.5 size-1.25 shrink-0 rounded-full',
              this.enabled && this.state.error && 'bg-destructive',
              this.enabled && !this.state.error && 'bg-green-600 dark:bg-green-300',
              this.enabled && !this.setup.completed && 'bg-amber-600 dark:bg-amber-300',
              !this.enabled && 'bg-muted-foreground',
            )}
          />
          <div className="truncate pr-9 font-normal">{this.spec.name}</div>
        </SidebarMenuButton>

        {/* Toggle Switch */}
        {this.setup.completed && (
          <TooltipWrap text={this.enabled ? 'Enabled' : 'Disabled'}>
            <div className="absolute right-2.5 flex">
              <Switch checked={this.enabled} onCheckedChange={value => this.setEnabled(value)} size="sm" />
            </div>
          </TooltipWrap>
        )}

        {/* Delete Button */}
        {!this.setup.completed && (
          <TooltipWrap text="Delete project">
            <Button variant="link" className="absolute right-1 hover:text-destructive" onClick={() => this.delete()}>
              <Trash2 className="size-3.75" />
            </Button>
          </TooltipWrap>
        )}
      </SidebarMenuItem>
    )
  }

  private MainView() {
    if (!this.state.ready) return null
    return (
      <div className="flex flex-col gap-4 p-4 pb-20">
        <this.HeaderView />
        {this.setup.completed ? (
          <>
            <this.ErrorView />
            <this.TabsView />
            {this.state.selectedTabId === 'spec' && <this.SpecView />}
            {this.state.selectedTabId === 'manifest' && <this.ManifestView />}
            {this.state.selectedTabId === 'files' && <this.FilesView />}
            {this.state.selectedTabId === 'settings' && <this.SettingsView />}
          </>
        ) : (
          <this.setup.View />
        )}
      </div>
    )
  }

  private HeaderView() {
    return (
      <div className="flex w-full flex-col gap-3 border-b pb-4">
        <div className="flex justify-between">
          <div className="flex h-8 items-end text-xl">{this.spec.name}</div>
          {this.setup.completed && (
            <div className="flex gap-2">
              <this.ReloadButtonView />
              <this.ExportButtonView />
            </div>
          )}
        </div>
        <div className="flex justify-between">
          <div className="flex gap-2 font-mono select-none">
            <this.StatusBadgeView />
            <Badge variant="secondary">{this.spec.slug}</Badge>
            <Badge variant="secondary">v{this.spec.version}</Badge>
          </div>
          {this.setup.completed && <this.TimestampView />}
        </div>
      </div>
    )
  }

  private ReloadButtonView() {
    return (
      <TooltipWrap text="Reload project">
        <Button variant="outline" onClick={() => this.reload()} className="dark:bg-[#151515] dark:hover:bg-[#1c1c1c]">
          <RefreshCw />
        </Button>
      </TooltipWrap>
    )
  }

  private ExportButtonView() {
    return (
      <Button variant="default" onClick={() => this.toggleExportDialog()}>
        <Package />
        Export
      </Button>
    )
  }

  private StatusBadgeView() {
    if (!this.enabled) {
      return (
        <Badge variant="secondary">
          <div className="mr-0.5 size-1 rounded-full bg-muted-foreground" /> disabled
        </Badge>
      )
    }

    if (!this.setup.completed) {
      return (
        <Badge variant="amber">
          <div className="mr-0.5 size-1 rounded-full bg-current" /> not connected
        </Badge>
      )
    }

    if (this.state.error) {
      return (
        <Badge variant="destructive" className="bg-red-100 dark:bg-[#3c1c1d]">
          <div className="mr-0.5 size-1 rounded-full bg-current" /> error
        </Badge>
      )
    }

    return (
      <TooltipWrap text="The project is connected to a local folder. Changes are being watched and applied in real-time.">
        <Badge variant="green">
          <div className="mr-0.5 size-1 rounded-full bg-current" /> active
        </Badge>
      </TooltipWrap>
    )
  }

  private TimestampView() {
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
  }

  private ErrorView() {
    if (!this.state.error) return null

    if (this.state.error.name === 'FOLDER_ACCESS_REVOKED') {
      return (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Folder access revoked</AlertTitle>
          <AlertDescription className="wrap-anywhere">
            The project lost access to its folder. Please reconnect the folder or update your browser permissions.
          </AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={() => this.connect()}>
              Reconnect
            </Button>
          </AlertAction>
        </Alert>
      )
    }

    return (
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>{this.state.error.name}</AlertTitle>
        <AlertDescription className="wrap-anywhere">{this.state.error.message}</AlertDescription>
      </Alert>
    )
  }

  private TabsView() {
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

  private SpecView() {
    if (!this.specText) {
      return (
        <this.Card>
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Not Found</EmptyTitle>
              <EmptyDescription>epos.json file is missing from the project directory.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </this.Card>
      )
    }

    return (
      <this.Card className="overflow-x-auto">
        <div className="w-fit p-4 pr-8">
          <this.$.highlight.Json value={this.specText} />
        </div>
      </this.Card>
    )
  }

  private ManifestView() {
    return (
      <this.Card className="relative overflow-hidden">
        <div
          className={cn(
            'absolute top-0 right-0 rounded-bl-xl border-b border-l bg-neutral-50 px-2.5 py-1.5 font-mono text-xs',
            'text-muted-foreground dark:bg-neutral-900',
          )}
        >
          generated based on the epos.json
        </div>
        <div className="w-full overflow-x-auto">
          <div className="w-fit p-4 pr-8">
            <this.$.highlight.Json value={JSON.stringify(this.manifest, null, 2)} />
          </div>
        </div>
      </this.Card>
    )
  }

  private FilesView() {
    const allFiles = [...this.jsSources, ...this.cssSources, ...this.assets]
    const uniqueFiles = [...new Map(allFiles.map(file => [file.path, file])).values()]

    if (uniqueFiles.length === 0) {
      return (
        <this.Card>
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No Files</EmptyTitle>
              <EmptyDescription>Project does not contain any files.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </this.Card>
      )
    }

    return (
      <this.Card className="overflow-hidden">
        <div className="flex items-center border-b bg-neutral-50 p-4 font-medium dark:bg-neutral-800/30">
          <div>
            <span>
              {uniqueFiles.length} {uniqueFiles.length === 1 ? 'file' : 'files'}
            </span>
          </div>
          <div className="ml-auto font-mono">
            {(uniqueFiles.reduce((sum, file) => sum + file.size, 0) / 1024).toFixed(2)} KB
          </div>
        </div>
        {uniqueFiles.map(file => (
          <div key={file.path} className="flex items-center p-4 not-last:border-b">
            <File className="mr-2 size-3.5" />
            <div>{file.path}</div>
            <div className="ml-auto font-mono">{(file.size / 1024).toFixed(2)} KB</div>
          </div>
        ))}
      </this.Card>
    )
  }

  private SettingsView() {
    return (
      <this.Card>
        <this.SettingsFolderView />
        <this.SettingsDebugView />
        <this.SettingsDeleteView />
      </this.Card>
    )
  }

  private SettingsFolderView() {
    if (!this.state.handle) return null
    return (
      <this.Section Icon={FolderOpen} title="Connected Folder" description="Local folder where project files are located.">
        <Button variant="outline" size="sm" onClick={() => this.connect()}>
          <Folder />
          <div className="max-w-30 truncate">{this.state.handle.name}</div>
        </Button>
      </this.Section>
    )
  }

  private SettingsDebugView() {
    const description = (
      <>
        Select which Epos build to use, including its built-in libraries like React and MobX. This option does not affect
        the exported bundle.
      </>
    )

    return (
      <this.Section Icon={Blocks} title="Epos Build" description={description}>
        <Select
          value={this.debug ? 'development' : 'production'}
          onValueChange={value => this.setDebug(value === 'development')}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </this.Section>
    )
  }

  private SettingsDeleteView() {
    return (
      <this.Section Icon={Trash2} title="Delete Project" description="Files on your computer won't be removed.">
        <Button variant="destructive" size="sm" onClick={() => this.toggleDeleteDialog()}>
          Delete
        </Button>
      </this.Section>
    )
  }

  private LoadingView() {
    return (
      <div className="flex size-full items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  private DeleteDialogView() {
    return (
      <AlertDialog open={this.state.showDeleteDialog} onOpenChange={() => this.toggleDeleteDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2 className="size-4.5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete {this.spec.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project. The files on your computer won't be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => this.delete()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  private ExportDialogView() {
    const unminifiedJsSource = this.jsSources.find(source => !source.minified)
    return (
      <Dialog open={this.state.showExportDialog} onOpenChange={() => this.toggleExportDialog()}>
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
            <Button variant="default" disabled={this.state.exporting} onClick={() => this.export()}>
              {unminifiedJsSource ? 'Export Anyway' : 'Export'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // MARK: UI Elements
  // ============================================================================

  Card(props: { children?: React.ReactNode; className?: string }) {
    return <div className={cn('-mt-px rounded-xl border bg-card text-sm', props.className)}>{props.children}</div>
  }

  Section(props: {
    Icon?: React.ComponentType<{ className?: string }>
    title?: string
    description?: React.ReactNode
    vertical?: boolean
    children?: React.ReactNode
    className?: string
  }) {
    return (
      <div
        className={cn(
          'flex justify-between gap-8 p-4 text-sm not-last:border-b',
          props.vertical && 'flex-col justify-start gap-2.5',
          props.className,
        )}
      >
        {(props.Icon || props.title || props.description) && (
          <div>
            {(props.Icon || props.title) && (
              <div className="flex items-center gap-2 font-medium">
                {props.Icon && <props.Icon className="size-3.5" />}
                {props.title}
              </div>
            )}
            {props.description && <div className="mt-1.5 max-w-md text-muted-foreground">{props.description}</div>}
          </div>
        )}
        <div>{props.children}</div>
      </div>
    )
  }

  DevView() {
    return (
      <div className="flex flex-col gap-4 p-4 *:border *:bg-neutral-50 dark:*:bg-neutral-900">
        <div>
          <this.setup.View />
        </div>
        <div>
          <this.SettingsView />
        </div>
        <div>
          <this.SidebarView />
        </div>
        <div>
          <this.DeleteDialogView />
        </div>
        <div>
          <this.ExportDialogView />
        </div>
        <div>
          <this.HeaderView />
        </div>
        <div>
          <this.StatusBadgeView />
        </div>
        <div>
          <this.ErrorView />
        </div>
        <div>
          <this.TabsView />
        </div>
        <div>
          <this.SpecView />
        </div>
        <div>
          <this.ManifestView />
        </div>
        <div>
          <this.FilesView />
        </div>
        <div>
          <this.SettingsView />
        </div>
        <div>
          <this.MainView />
        </div>
        <div className="h-15">
          <this.LoadingView />
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
