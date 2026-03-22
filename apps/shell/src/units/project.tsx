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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.js'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.js'
import { Field, FieldLabel } from '@/components/ui/field.js'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar.js'
import { Spinner } from '@/components/ui/spinner.js'
import { Switch } from '@/components/ui/switch.js'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.js'
import { TooltipWrap } from '@/components/ui/tooltip.js'
import { cn } from '@/lib/utils.js'
import type { Assets, Manifest, ProjectBase, Sources, Spec } from 'epos'
import { AlertTriangle, Package, RefreshCw, Trash2 } from 'lucide-react'

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
      showRemoveDialog: false,
      showExportDialog: false,
      selectedTabId: 'spec' as TabId,
      updatedAt: null as Date | null,
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
    this.state.updatedAt = new Date()
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

  selectTab(tabId: TabId) {
    this.state.selectedTabId = tabId
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
      this.jsSources = []
      this.cssSources = []
      const sources: Sources = {}
      for (const target of spec.targets) {
        for (const resource of target.resources) {
          if (sources[resource.path]) continue
          const file = await this.readFile(resource.path)
          const content = await file.text()
          sources[resource.path] = content
          if (resource.path.endsWith('.js')) {
            this.jsSources.push({ path: resource.path, size: file.size, minified: this.isMinifiedJs(content) })
          } else if (resource.path.endsWith('.css')) {
            this.cssSources.push({ path: resource.path, size: file.size })
          }
        }
      }

      // Update project
      await epos.projects.update(this.id, { spec, sources, assets })
    })
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

  // MARK: Views
  // ===========================================================================

  View() {
    return (
      <div className="flex h-full flex-col">
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
              'mx-0.5 size-1.25 shrink-0 rounded-full bg-green-600 dark:bg-green-300',
              this.state.error && 'bg-destructive',
              !this.state.handle && 'bg-amber-600 dark:bg-amber-300',
              !this.enabled && 'bg-muted-foreground',
            )}
          />
          <div className="truncate pr-9 font-normal">{this.spec.name}</div>
        </SidebarMenuButton>
        <TooltipWrap text={this.enabled ? 'Disable' : 'Enable'}>
          <div className="absolute right-2 h-4.5">
            <Switch checked={this.enabled} onCheckedChange={() => this.toggle()} size="sm" />
          </div>
        </TooltipWrap>
      </SidebarMenuItem>
    )
  }

  private MainView() {
    if (!this.state.ready) return null

    return (
      <div className="flex h-full w-full flex-col gap-6 p-6 pt-4">
        <this.HeaderView />
        <this.ContentView />
      </div>
    )
  }

  private HeaderView() {
    return (
      <div className="flex w-full flex-col gap-1.5">
        <div className="flex justify-between">
          <this.NameView />
          <this.ActionsView />
        </div>
        <div className="flex justify-between">
          <this.BadgesView />
          <this.TimestampView />
        </div>
      </div>
    )
  }

  private NameView() {
    return <div className="text-xl/[32px]">{this.spec.name}</div>
  }

  private BadgesView() {
    return (
      <div className="flex gap-1.5 font-mono">
        <this.StatusBadgeView />
        <Badge variant="secondary">{this.spec.slug}</Badge>
        <Badge variant="secondary">v{this.spec.version}</Badge>
      </div>
    )
  }

  private StatusBadgeView() {
    const dot = (className?: string) => <div className={cn('mr-0.5 size-1.25 rounded-full bg-current', className)} />
    if (!this.enabled) return <Badge variant="secondary">{dot('bg-muted-foreground')} disabled</Badge>
    if (!this.state.handle) return <Badge variant="yellow">{dot()} not connected</Badge>
    if (this.state.error) return <Badge variant="destructive">{dot()} error</Badge>
    return <Badge variant="green">{dot()} connected</Badge>
  }

  private ActionsView() {
    const onRemoveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (e.shiftKey) {
        this.remove()
      } else {
        this.toggleRemoveDialog()
      }
    }

    return (
      <div className="flex gap-2">
        <TooltipWrap text="Delete project">
          <Button variant="outline" onClick={onRemoveClick}>
            <Trash2 />
          </Button>
        </TooltipWrap>
        <TooltipWrap text="Refresh project">
          <Button variant="outline" onClick={() => this.refresh()}>
            <RefreshCw />
          </Button>
        </TooltipWrap>
        <Button variant="default" onClick={() => this.toggleExportDialog()}>
          <Package />
          Export
        </Button>
      </div>
    )
  }

  private TimestampView() {
    if (!this.enabled) return null
    if (!this.state.handle) return null
    if (!this.state.updatedAt) return null
    const hh = this.state.updatedAt.getHours().toString().padStart(2, '0')
    const mm = this.state.updatedAt.getMinutes().toString().padStart(2, '0')
    const ss = this.state.updatedAt.getSeconds().toString().padStart(2, '0')
    const ms = this.state.updatedAt.getMilliseconds().toString().padStart(3, '0')
    return (
      <div className="text-xs/[20px] text-neutral-400 not-first:font-mono dark:text-neutral-600">
        Updated at {hh}:{mm}:{ss}:{ms}
      </div>
    )
  }

  private ContentView() {
    // TODO: instead of cards, use TABS
    // epos.json | manifest.json | Files | Settings
    // in settings: debug (use production libs) and connected directory

    const { title, description, View } = {
      spec: {
        title: 'epos.json',
        description: 'View and edit your project specification file (epos.json)',
        View: this.SpecView,
      },
      manifest: {
        title: 'Extension Manifest',
        description: 'View your project manifest file (manifest.json) generated by epos based on your spec',
        View: this.ManifestView,
      },
      files: {
        title: 'Project Files',
        description: 'View your project source files and assets',
        View: this.FilesView,
      },
      settings: {
        title: 'Project Settings',
        description: 'Configure your project settings and preferences',
        View: this.SettingsView,
      },
    }[this.state.selectedTabId]

    return (
      <Card className="relative gap-0 p-0">
        <CardHeader className="border-b p-4">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <View />
        </CardContent>

        <Tabs
          value={this.state.selectedTabId}
          onValueChange={tabId => this.selectTab(tabId as TabId)}
          className="absolute top-4 right-4"
        >
          <TabsList variant="default" className="gap-1">
            <TabsTrigger value="spec">epos.json</TabsTrigger>
            <TabsTrigger value="manifest">Manifest</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </Tabs>
      </Card>
    )

    return (
      <div className="mt-6 flex grow flex-col gap-6">
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription className="wrap-anywhere">
            This is a read-only view of your project files. To edit the files, connect the project to a directory on your
            computer.
          </AlertDescription>
        </Alert>
        <div className="flex gap-6">
          <div className="flex h-full w-100 shrink-0 flex-col gap-6">
            <Card className="h-50">
              <CardContent>DIRECTORY</CardContent>
            </Card>
            <Card className="grow">
              <CardContent>SOURCES</CardContent>
            </Card>
          </div>
          <Card>
            <CardContent>
              <Tabs defaultValue="spec">
                <TabsList>
                  <TabsTrigger value="spec">epos.json</TabsTrigger>
                  <TabsTrigger value="manifest">manifest.json</TabsTrigger>
                </TabsList>
                <TabsContent value="spec">
                  <this.JsonView json={this.specText ?? '—'} />
                </TabsContent>
                <TabsContent value="manifest">
                  <this.JsonView json={JSON.stringify(this.manifest, null, 2)} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  private SpecView() {
    return <this.$.highlight.JsonView value={this.specText ?? '—'} />
  }

  private ManifestView() {
    return <this.$.highlight.JsonView value={JSON.stringify(this.manifest, null, 2)} />
  }

  private FilesView() {
    return <div>FILES</div>
  }

  private SettingsView() {
    return (
      <div>
        <Field>
          <FieldLabel>Debug Mode</FieldLabel>
          <Switch checked={this.debug} onCheckedChange={() => this.toggleDebug()} />
        </Field>
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
              This will permanently delete the project. The files on your computer will not be affected.
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
            <DialogDescription>Generate standalone extension ZIP bundle.</DialogDescription>
            {unminifiedJsSource && (
              <Alert variant="warning" className="mt-1">
                <AlertTriangle />
                <AlertTitle>Unminified JS detected</AlertTitle>
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

  JsonView({ json }: { json: string }) {
    return (
      <pre className="max-h-[650px] overflow-auto rounded-md bg-card p-4">
        <code>{json}</code>
      </pre>
    )
  }

  // MARK: Versioner
  // ============================================================================

  static versioner: any = {}
}
