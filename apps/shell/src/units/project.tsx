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
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field.js'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.js'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.js'
import { Separator } from '@/components/ui/separator.js'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar.js'
import { Spinner } from '@/components/ui/spinner.js'
import { Switch } from '@/components/ui/switch.js'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.js'
import { TooltipWrap } from '@/components/ui/tooltip.js'
import { cn } from '@/lib/utils.js'
import type { Assets, Manifest, ProjectBase, Sources, Spec } from 'epos'
import { AlertTriangle, Bolt, BookText, File, Folder, FolderOpen, Layers, Package, RefreshCw, Trash2 } from 'lucide-react'

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
  selectedTabId: TabId = 'spec'

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
      showConnectDialog: false,
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

  async setEnabled(value: boolean) {
    await epos.projects.update(this.id, { enabled: value })
  }

  async setDebug(value: boolean) {
    await epos.projects.update(this.id, { debug: value })
  }

  async remove() {
    await epos.projects.remove(this.id)
    const firstProject = this.$projects.list[0]
    console.warn(this.$projects.list)
    if (firstProject) firstProject.select()
  }

  toggleRemoveDialog() {
    this.state.showRemoveDialog = !this.state.showRemoveDialog
  }

  toggleExportDialog() {
    this.state.showExportDialog = !this.state.showExportDialog
  }

  toggleConnectDialog() {
    this.state.showConnectDialog = !this.state.showConnectDialog
  }

  selectTab(tabId: TabId) {
    this.selectedTabId = tabId
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
      <div className="mx-auto flex h-full w-full max-w-180 flex-col">
        <this.MainView />
        <this.LoadingView />
        <this.RemoveDialogView />
        <this.ExportDialogView />
        <this.ConnectDialogView />
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
              !this.state.handle && 'bg-amber-600 dark:bg-amber-300',
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
    return (
      <div className="flex w-full flex-col gap-1.5 border-b pb-4">
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
      <div className="flex gap-1.5 font-mono select-none">
        <this.StatusBadgeView />
        <Badge variant="secondary">{this.spec.slug}</Badge>
        <Badge variant="secondary">v{this.spec.version}</Badge>
      </div>
    )
  }

  private StatusBadgeView() {
    const dot = (className?: string) => <div className={cn('mr-0.5 size-1 rounded-full bg-current', className)} />
    if (!this.enabled) return <Badge variant="secondary">{dot('bg-muted-foreground')} disabled</Badge>
    if (!this.state.handle) return <Badge variant="amber">{dot()} not connected</Badge>
    if (this.state.error) return <Badge variant="destructive">{dot()} error</Badge>
    return <Badge variant="green">{dot()} live</Badge>
  }

  private ActionsView() {
    if (!this.state.handle) return null
    return (
      <div className="flex gap-2">
        <TooltipWrap text="Reload project">
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
      <div className="font-mono text-xs/[20px] text-muted-foreground">
        Updated at {hh}:{mm}:{ss}:{ms}
      </div>
    )
  }

  private ErrorView() {
    if (!this.state.error) return null
    const cause = this.state.error.cause
    return (
      <div className="flex gap-2.5 border-l-3 border-destructive bg-destructive/10 py-2 pr-4 pl-2.5 text-sm text-destructive">
        <AlertTriangle className="relative top-0.5 size-4 shrink-0" />
        <div className="space-y-1">
          <div className="font-medium">{this.state.error.message}</div>
          {!!cause && <div>{this.$.utils.is.error(cause) ? cause.message : String(cause)}</div>}
        </div>
      </div>
    )
  }

  private TabsView() {
    if (!this.state.handle) return null

    return (
      <Tabs value={this.selectedTabId} onValueChange={tabId => this.selectTab(tabId as TabId)} className="select-none">
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
      <>
        {/* <div className="_p-4 mb-4 rounded-lg border bg-card p-4">
          <div className="text-sm font-medium">Setup Project</div>
          <div className="mt-1 max-w-sm text-sm text-muted-foreground">
            To get started, connect a local folder containing your project files, or initialize a new project from a
            template.
          </div>
        </div> */}
        <div className="overflow-auto rounded-xl border bg-card">
          <this.SetupView />
          <this.SpecView />
          <this.ManifestView />
          <this.FilesView />
          <this.SettingsView />
        </div>
      </>
    )
  }

  private SetupView() {
    if (this.state.handle) return null

    // return (
    //   <div className="flex flex-col">
    //     <div className="flex justify-between p-4">
    //       <div className="flex flex-col gap-1">
    //         <div className="flex items-center gap-2 text-sm font-medium">Connect Folder</div>
    //         <div className="space-y-0.5 text-sm text-muted-foreground">
    //           <div>The project has to be connected to a folder on your computer.</div>
    //         </div>
    //       </div>
    //     </div>
    //     <Separator />
    //     <div className="flex justify-between p-4">
    //       <div className="flex flex-col gap-1">
    //         <div className="flex items-center gap-2 text-sm font-medium">
    //           <Layers className="size-3.5" />
    //           Use Template
    //           <Badge variant="secondary" className="font-mono text-xs">
    //             recommended
    //           </Badge>
    //         </div>
    //         <div className="space-y-0.5 text-sm text-muted-foreground">Vite + TypeScript + Tailwind CSS</div>
    //       </div>
    //       <div className="flex gap-2">
    //         <Switch checked={true} onCheckedChange={() => {}} />
    //       </div>
    //     </div>
    //     <Separator />
    //     <div className="grid w-full grid-cols-2 gap-4 p-4">
    //       <Button size="lg" onClick={() => this.toggleConnectDialog()}>
    //         <FolderOpen />
    //         Select Folder
    //         {/* <ArrowRight /> */}
    //       </Button>
    //       <Button variant="outline" size="lg" onClick={() => this.remove()}>
    //         Delete
    //       </Button>
    //     </div>
    //     {/* <Separator />
    //     <div className="flex justify-between p-4">
    //       <div className="flex flex-col gap-1">
    //         <div className="flex items-center gap-2 text-sm font-medium">
    //           <Bolt className="size-3.5" />
    //           Manual
    //         </div>
    //         <div className="max-w-md space-y-0.5 text-sm text-muted-foreground">
    //           Just connect folder. Select this option if you are connecting existing Epos project or want to set it up
    //           manually.
    //         </div>
    //       </div>
    //       <div className="flex gap-2">
    //         <Button size="sm" onClick={() => this.toggleConnectDialog()} className="gap-1.5">
    //           Select Folder <ArrowRight />
    //         </Button>
    //       </div>
    //     </div>
    //     <Separator />
    //     <div className="flex justify-between p-4">
    //       <div className="flex flex-col gap-1">
    //         <div className="flex items-center gap-2 text-sm font-medium">
    //           <Trash2 className="size-3.5" />
    //           Delete Project
    //         </div>
    //         <div className="space-y-0.5 text-sm text-muted-foreground">Delete this project from project list.</div>
    //       </div>
    //       <div className="flex gap-2">
    //         <Button variant="destructive" size="sm" onClick={() => this.remove()}>
    //           Delete
    //         </Button>
    //       </div>
    //     </div> */}
    //   </div>
    // )

    return (
      <div className="flex flex-col">
        <div className="p-4 pb-5">
          <div className="flex items-center text-sm font-medium">
            {/* <Info className="mr-2 size-3.5" /> */}
            Connect Folder
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            The project has to be connected to a folder on your computer.
          </div>

          <RadioGroup defaultValue="comfortable" className="mt-5 w-fit max-w-md space-y-2">
            <Field orientation="horizontal">
              <RadioGroupItem value="default" id="desc-r1" />
              <FieldContent>
                <FieldLabel htmlFor="desc-r1">
                  Use Template
                  <Layers className="size-3.5" />
                  {/* <Badge variant="secondary" className="pl-1 font-mono text-xs">
                    recommended
                  </Badge> */}
                </FieldLabel>
                <FieldDescription>
                  Initialize preconfigured project structure.
                  <br />
                  Vite + TypeScript + Tailwind CSS.
                  {/* Initialize preconfigured project structure with Vite, TypeScript, and Tailwind CSS. */}
                </FieldDescription>
              </FieldContent>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem value="comfortable" id="desc-r2" />
              <FieldContent>
                <FieldLabel htmlFor="desc-r2">
                  Manual Setup <Bolt className="size-3.5" />
                </FieldLabel>
                <FieldDescription>
                  Just connect a folder. Select this option if you are connecting existing Epos project or want to set it up
                  manually.
                </FieldDescription>
              </FieldContent>
            </Field>
          </RadioGroup>

          {/* <RadioGroup defaultValue="plus" className="mt-4 max-w-sm">
            <FieldLabel htmlFor="plus-plan">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Default Template</FieldTitle>
                  <FieldDescription>Vite + TypeScript + Tailwind CSS</FieldDescription>
                </FieldContent>
                <RadioGroupItem value="plus" id="plus-plan" />
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="pro-plan">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>No Template</FieldTitle>
                  <FieldDescription>Just connect local folder</FieldDescription>
                </FieldContent>
                <RadioGroupItem value="pro" id="pro-plan" />
              </Field>
            </FieldLabel>
          </RadioGroup> */}

          {/* <ol className="mt-2 ml-4 flex list-decimal flex-col gap-1 text-sm text-muted-foreground">
            <li>Select folder</li>
            <li>Or use template</li>
          </ol> */}
          {/* <div className="mt-1 max-w-sm text-sm text-muted-foreground">
            1. To get started, connect a local folder containing your project files, or initialize a new project from a
            template.
          </div>
          <div className="mt-1 max-w-sm text-sm text-muted-foreground">
            2. To get started, connect a local folder containing your project files, or initialize a new project from a
            template.
          </div> */}
        </div>
        {/* <Separator />
        <Field orientation="horizontal" className="p-4">
          <FieldContent>
            <FieldLabel htmlFor="switch-focus-mode" className="flex items-center">
              <Layers className="size-3.5" />
              Use Template
            </FieldLabel>
            <FieldDescription>Vite + TypeScript + Tailwind CSS</FieldDescription>
          </FieldContent>
          <Switch id="switch-focus-mode" />
        </Field>
        <Separator /> */}

        <Separator />
        <div className="grid w-full grid-cols-2 gap-4 p-4">
          <Button size="lg" onClick={() => this.toggleConnectDialog()}>
            <FolderOpen />
            Select Folder
            {/* <ArrowRight /> */}
          </Button>
          <Button variant="outline" size="lg" onClick={() => this.remove()}>
            Delete
          </Button>
        </div>
      </div>
    )
  }

  private SpecView() {
    if (!this.state.handle) return null
    if (this.selectedTabId !== 'spec') return null
    return <this.JsonView json={this.specText ?? '—'} />
  }

  private ManifestView() {
    if (!this.state.handle) return null
    if (this.selectedTabId !== 'manifest') return null
    return (
      <this.JsonView json={JSON.stringify(this.manifest, null, 2)} title="Automatically generated based on the epos.json" />
    )
  }

  private FilesView() {
    if (!this.state.handle) return null
    if (this.selectedTabId !== 'files') return null

    const allFiles = [...this.jsSources, ...this.cssSources, ...this.assets]
    const uniqueFiles = [...new Map(allFiles.map(file => [file.path, file])).values()]

    return (
      <div className="px-0 py-0 text-sm">
        {uniqueFiles.map(file => (
          <div key={file.path} className="flex items-center border-b p-4">
            <File className="mr-2 size-3.5" />
            <div>{file.path}</div>
            <div className="ml-auto font-mono">{(file.size / 1024).toFixed(2)} KB</div>
          </div>
        ))}
        <div className="flex items-center p-4">
          <div className="text-muted-foreground">
            Total {uniqueFiles.length} {uniqueFiles.length === 1 ? 'file' : 'files'}
          </div>
          <div className="ml-auto font-mono text-muted-foreground">
            {(uniqueFiles.reduce((sum, file) => sum + file.size, 0) / 1024).toFixed(2)} KB
          </div>
        </div>
      </div>
    )
  }

  private SettingsView() {
    if (!this.state.handle) return null
    if (this.selectedTabId !== 'settings') return null

    return (
      <div className="flex flex-col">
        <div className="flex justify-between p-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FolderOpen className="size-3.5" />
              Connected Folder
            </div>
            <div className="text-sm text-muted-foreground">Local folder where project files are located.</div>
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
        <Separator />
        <div className="flex justify-between p-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BookText className="size-3.5" />
              Library Builds
            </div>
            <div className="space-y-0.5 text-sm text-muted-foreground">
              <div>Choose which builds of React, MobX, and Yjs to use.</div>
              <div>This option does not affect the exported bundle.</div>
            </div>
          </div>
          <div className="flex gap-2">
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
        <Separator />
        <div className="flex justify-between p-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Trash2 className="size-3.5" />
              Delete Project
            </div>
            <div className="space-y-0.5 text-sm text-muted-foreground">Files on your computer won't be removed.</div>
          </div>
          <div className="flex gap-2">
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

  private ConnectDialogView() {
    if (!this.state.showConnectDialog) return null

    return (
      <Dialog open={true} onOpenChange={() => this.toggleConnectDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Folder</DialogTitle>
            <DialogDescription>Connect a local folder to your project.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="default" onClick={() => this.connect()}>
              Select Folder
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
      this.selectedTabId = 'spec'
    },
  }
}
