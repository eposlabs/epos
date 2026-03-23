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
import { ButtonGroup } from '@/components/ui/button-group.js'
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field.js'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item.js'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.js'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.js'
import { Separator } from '@/components/ui/separator.js'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar.js'
import { Spinner } from '@/components/ui/spinner.js'
import { Switch } from '@/components/ui/switch.js'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.js'
import { TooltipWrap } from '@/components/ui/tooltip.js'
import { cn } from '@/lib/utils.js'
import type { Assets, Manifest, ProjectBase, Sources, Spec } from 'epos'
import { AlertCircle, AlertTriangle, BookOpen, FolderOpen, Library, Package, RefreshCw, Trash2, Unplug } from 'lucide-react'

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
      <div className="mx-auto flex h-full w-full max-w-200 flex-col">
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
        <this.ErrorView />
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
    const dot = (className?: string) => <div className={cn('mr-0.5 size-1 rounded-full bg-current', className)} />
    if (!this.enabled) return <Badge variant="secondary">{dot('bg-muted-foreground')} disabled</Badge>
    if (!this.state.handle) return <Badge variant="amber">{dot()} not connected</Badge>
    if (this.state.error) return <Badge variant="destructive">{dot()} error</Badge>
    return <Badge variant="green">{dot()} live</Badge>
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
      <div className="text-xs/[20px] text-neutral-400 not-first:font-mono dark:text-neutral-600">
        updated at {hh}:{mm}:{ss}:{ms}
      </div>
    )
  }

  private ErrorView() {
    if (!this.state.error) return null
    const cause = this.state.error.cause
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-4" />
        <AlertTitle>{this.state.error.message}</AlertTitle>
        {!!cause && <AlertDescription>{this.$.utils.is.error(cause) ? cause.message : String(cause)}</AlertDescription>}
      </Alert>
    )
  }

  private ContentView() {
    const { title, description, View } = {
      spec: {
        title: 'epos.json',
        description: `Raw content of the epos.json file.`,
        View: this.SpecView,
      },
      manifest: {
        title: 'manifest.json',
        description: `Generated extension manifest based on epos.json.`,
        View: this.ManifestView,
      },
      files: {
        title: 'Project Files',
        description: 'View information about project files.',
        View: this.FilesView,
      },
      settings: {
        title: 'Project Settings',
        description: 'Manage project preferences.',
        View: this.SettingsView,
      },
    }[this.selectedTabId]

    return (
      <Card className="relative gap-0 p-0">
        <Tabs
          value={this.selectedTabId}
          onValueChange={tabId => this.selectTab(tabId as TabId)}
          className="absolute top-4 right-4"
        >
          <TabsList variant="default" className="gap-1">
            <TabsTrigger value="spec">epos.json</TabsTrigger>
            <TabsTrigger value="manifest">manifest.json</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </Tabs>

        <CardHeader className="border-b p-4">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="min-h-0 overflow-auto p-0">
          <div className="w-full min-w-fit p-4">
            <View />
          </div>
        </CardContent>
      </Card>
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
    if (!this.state.handle) return null

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">Connected Folder</div>
            <div className="text-sm text-muted-foreground">Local folder where project files are located.</div>
          </div>
          <div className="flex gap-2">
            <ButtonGroup>
              <Button variant="outline" size="sm">
                <FolderOpen />
                ./{this.state.handle.name}
              </Button>
              <Button variant="outline" size="sm">
                Disconnect
              </Button>
            </ButtonGroup>
          </div>
        </div>
        <Separator />
        <div className="flex justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">Built-in Libraries</div>
            <div className="text-sm text-muted-foreground">
              <div>Choose which builds of React, MobX, and Yjs to use.</div>
              <div className="mt-1 flex items-center gap-1.5 opacity-40">
                <AlertCircle className="size-3.5 shrink-0" />
                Does not affect the exported bundle
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={this.debug ? 'development' : 'production'} onValueChange={value => this.toggleDebug()}>
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
      </div>
    )

    return (
      <FieldGroup className="max-w-sm">
        <FieldSet>
          <FieldLabel>
            <FolderOpen className="size-4" />
            Connected Folder
          </FieldLabel>
          <FieldDescription>
            Currently connected folder. To select another folder, disconnect the current one first.
          </FieldDescription>
          <FieldGroup>
            <this.ConnectedFolderView />
          </FieldGroup>
        </FieldSet>
        <FieldSeparator />
        <FieldSet>
          <FieldLabel>
            <BookOpen className="size-4" />
            Built-in Libs
          </FieldLabel>
          <FieldDescription>Choose which version of built-in libraries to use (React, MobX, Yjs).</FieldDescription>
          <FieldGroup>
            <Field>
              <RadioGroup defaultValue="plus" className="max-w-sm">
                <FieldLabel htmlFor="plus-plan">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Development</FieldTitle>
                      <FieldDescription>Use unminified dev builds.</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value="plus" id="plus-plan" />
                  </Field>
                </FieldLabel>
                <FieldLabel htmlFor="pro-plan">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Production</FieldTitle>
                      <FieldDescription>Use minified production builds.</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value="pro" id="pro-plan" />
                  </Field>
                </FieldLabel>
              </RadioGroup>
            </Field>
          </FieldGroup>
          <FieldDescription className="flex gap-2">
            <AlertCircle className="relative top-0.5 size-4 shrink-0" />
            This option does not affect the exported bundle which always uses production builds.
          </FieldDescription>
        </FieldSet>
      </FieldGroup>
    )
  }

  private ConnectedFolderView() {
    if (!this.state.handle) return null

    // return (
    //   <Field>
    //     <FieldTitle>Connected Folder</FieldTitle>
    //     <FieldContent>
    //       <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
    //         <FolderOpen className="size-4" />
    //         <div className="flex flex-col">
    //           <div className="text-sm">./{this.state.handle.name}</div>
    //           <div className="text-xs text-muted-foreground">Currently connected folder.</div>
    //         </div>
    //       </div>
    //     </FieldContent>
    //   </Field>
    // )

    // return (
    //   <div className="flex min-w-[400px] justify-between">
    //     <div>
    //       <FolderOpen className="mr-2 inline size-4" />
    //       Connected Folder
    //     </div>
    //     <div>./{this.state.handle.name}</div>
    //   </div>
    // )
    return (
      <Item variant="outline" className="min-w-[400px]">
        {/* <ItemMedia variant="icon">
          <FolderOpen />
        </ItemMedia> */}
        <ItemContent>
          <ItemTitle>./{this.state.handle.name}</ItemTitle>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="outline">
            Disconnect
          </Button>
        </ItemActions>
      </Item>
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
            <DialogDescription>Generate a standalone extension ZIP bundle.</DialogDescription>
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

  // MARK: Versioner
  // ============================================================================

  static versioner: any = {
    1() {
      this.selectedTabId = 'spec'
    },
  }
}
