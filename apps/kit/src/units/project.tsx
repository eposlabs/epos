import { IconAlertCircle, IconDownload, IconFolderOpen, IconPointFilled, IconRefresh, IconTrash } from '@tabler/icons-react'
import { Alert, AlertDescription } from '@ui/components/ui/alert'
import { Button } from '@ui/components/ui/button'
import { Label } from '@ui/components/ui/label'
import { Separator } from '@ui/components/ui/separator.js'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@ui/components/ui/sheet'
import { SidebarMenuButton, SidebarMenuItem } from '@ui/components/ui/sidebar'
import { Spinner } from '@ui/components/ui/spinner'
import { Switch } from '@ui/components/ui/switch'
import { cn } from '@ui/lib/utils'
import type { Assets, Manifest, ProjectBase, Sources, Spec } from 'epos'

export class Project extends gl.Unit {
  debug: boolean
  enabled: boolean
  spec: Spec
  manifest: Manifest
  specText: string | null = null
  assetsInfo: Record<string, { size: number }> = {}
  sourcesInfo: Record<string, { size: number }> = {}

  get state() {
    return {
      ready: false,
      updating: false,
      error: null as Error | null,
      handle: null as FileSystemDirectoryHandle | null,
      observers: [] as FileSystemObserver[],
      activeTab: 'spec' as 'spec' | 'manifest' | 'assets' | 'sources',
      showExportDialog: false,
    }
  }

  constructor(parent: gl.Unit, params: ProjectBase) {
    super(parent)
    this.id = params.id
    this.debug = params.debug
    this.spec = params.spec
    this.manifest = params.manifest
    this.enabled = params.enabled
  }

  async attach() {
    this.hydrate = this.$.utils.enqueue(this.hydrate)
    const handle = await this.$.idb.get<FileSystemDirectoryHandle>('kit', 'handles', this.id)
    if (handle) await this.setHandle(handle)
    this.state.ready = true
  }

  async detach() {
    await this.setHandle(null)
  }

  private get $projects() {
    return this.closest(gl.Projects)!
  }

  get selected() {
    return this.$projects.selectedProjectId === this.id
  }

  get paths() {
    const assetPaths = this.spec.assets
    const resourcePaths = this.spec.targets.flatMap(target => target.resources.map(resource => resource.path))
    return ['epos.json', ...assetPaths, ...resourcePaths]
  }

  update(updates: Omit<ProjectBase, 'id'>) {
    this.debug = updates.debug
    this.enabled = updates.enabled
    this.spec = updates.spec
    this.manifest = updates.manifest
  }

  select() {
    this.$projects.selectedProjectId = this.id
  }

  async toggleEnabled() {
    await epos.projects.update(this.id, { enabled: !this.enabled })
  }

  async toggleDebug() {
    await epos.projects.update(this.id, { debug: !this.debug })
  }

  async remove() {
    await epos.projects.remove(this.id)
  }

  async connectDir() {
    const [handle] = await this.$.utils.safe(() => showDirectoryPicker({ mode: 'read' }))
    if (!handle) return
    await this.setHandle(handle)
  }

  async disconnectDir() {
    await this.setHandle(null)
  }

  private async setHandle(handle: FileSystemDirectoryHandle | null) {
    if (handle) {
      await this.$.idb.set('kit', 'handles', this.id, handle)
      this.state.handle = handle
      await this.hydrate()
      this.observe()
    } else {
      await this.$.idb.delete('kit', 'handles', this.id)
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
        timer = setTimeout(() => this.hydrate())
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

  private async hydrate() {
    try {
      this.state.error = null
      this.state.updating = true

      // Read epos.json
      const [specText, readError] = await this.$.utils.safe(() => this.readFileAsText('epos.json'))
      if (readError) throw new Error('Failed to read epos.json', { cause: readError })
      this.specText = specText

      // Parse epos.json
      const [spec, parseError] = this.$.utils.safeSync(() => this.$.libs.parseSpecJson(specText))
      if (parseError) throw new Error('Failed to parse epos.json', { cause: parseError })

      // Read assets
      this.assetsInfo = {}
      const assets: Assets = {}
      for (const path of spec.assets) {
        const file = await this.readFile(path)
        assets[path] = file
        this.assetsInfo[path] = { size: file.size }
      }

      // Read sources
      this.sourcesInfo = {}
      const sources: Sources = {}
      for (const target of spec.targets) {
        for (const resource of target.resources) {
          if (sources[resource.path]) continue
          const file = await this.readFileAsText(resource.path)
          sources[resource.path] = file
          this.sourcesInfo[resource.path] = { size: file.length }
        }
      }

      // Update project
      await epos.projects.update(this.id, { spec, sources, assets })
    } catch (e) {
      this.state.error = this.$.utils.is.error(e) ? e : new Error(String(e))
    } finally {
      this.state.updating = false
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

  private async getFileHandle(path: string) {
    const parts = path.split('/')
    const dirs = parts.slice(0, -1)
    const name = parts.at(-1)
    if (!name) throw this.never()

    // Get dir handle
    if (!this.state.handle) throw new Error('Project directory is not connected')
    let dirHandle = this.state.handle
    for (const dir of dirs) {
      const [nextDirHandle] = await this.$.utils.safe(() => dirHandle.getDirectoryHandle(dir))
      if (!nextDirHandle) throw new Error(`File not found: ${path}`)
      dirHandle = nextDirHandle
    }

    // Get file handle
    const [fileHandle] = await this.$.utils.safe(() => dirHandle.getFileHandle(name))
    if (!fileHandle) throw new Error(`File not found: ${path}`)

    return fileHandle
  }

  async export() {
    const files = await epos.projects.export(this.id)
    const zip = await this.$.utils.zip(files)
    const url = URL.createObjectURL(zip)
    const filename = `${this.spec.slug}-${this.spec.version}.zip`
    await epos.browser.downloads.download({ url, filename })
    URL.revokeObjectURL(url)
  }

  private hasUnminifiedSources(): boolean {
    // Check if sources look unminified (have readable structure)
    // Conservative approach: assume sources are unminified if they're readable
    return Object.keys(this.sourcesInfo).length > 0
  }

  View() {
    if (!this.state.ready) return <this.LoadingView />
    if (!this.state.handle) return <this.NoDirectoryView />
    return <this.MainView />
  }

  LoadingView() {
    return (
      <div className="flex size-full items-center justify-center">
        <Spinner />
      </div>
    )
  }

  NoDirectoryView() {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-6 p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold">No Directory Connected</h2>
          <p className="mt-2 text-sm text-muted-foreground">Connect a directory to load your project files</p>
        </div>

        {this.state.error && (
          <Alert variant="destructive" className="w-full max-w-md">
            <IconAlertCircle className="size-4" />
            <AlertDescription>{this.state.error.message}</AlertDescription>
          </Alert>
        )}

        <div className="w-full max-w-md space-y-3">
          <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium">How it works:</p>
            <ol className="list-inside list-decimal space-y-1 text-xs text-muted-foreground">
              <li>Click "Connect Directory" below</li>
              <li>Select the folder where your project files are located</li>
              <li>The kit will automatically load epos.json, assets, and sources</li>
            </ol>
          </div>

          <Button onClick={() => this.connectDir()} className="w-full" size="sm">
            <IconFolderOpen className="mr-2 size-4" />
            Connect Directory
          </Button>
        </div>
      </div>
    )
  }

  MainView() {
    return (
      <div className="flex h-full flex-col gap-4 p-6">
        {/* Header with Directory Info */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{this.spec.name}</h1>
            <p className="text-sm text-muted-foreground">
              {this.spec.slug} • v{this.spec.version}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              {this.state.error && (
                <div className="flex items-center gap-1 rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
                  <IconAlertCircle className="size-3" />
                  Error
                </div>
              )}
              {this.state.updating && (
                <div className="flex items-center gap-1 rounded bg-blue-500/10 px-2 py-1 text-xs text-blue-500">
                  <Spinner className="size-3" />
                  Updating
                </div>
              )}
            </div>
            {/* Directory and Reconnect */}
            <div className="flex items-center gap-2 rounded border border-border bg-muted/30 px-3 py-2 text-xs">
              <span className="font-medium">Directory:</span>
              <span className="text-muted-foreground">./{this.state.handle?.name || 'unknown'}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => this.connectDir()}
                className="ml-2 px-2 py-0.5 text-xs"
                title="Reconnect to a different directory"
              >
                <IconRefresh className="size-3" />
              </Button>
            </div>
          </div>
        </div>

        {this.state.error && (
          <Alert variant="destructive">
            <IconAlertCircle className="size-4" />
            <AlertDescription>
              <p className="font-medium">{this.state.error.message}</p>
              {this.state.error.cause ? (
                <p className="mt-1 text-xs opacity-90">
                  {
                    (this.state.error.cause instanceof Error
                      ? this.state.error.cause.message
                      : String(this.state.error.cause)) as any
                  }
                </p>
              ) : null}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          {(['spec', 'sources', 'assets', 'manifest'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => (this.state.activeTab = tab)}
              className={cn(
                'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                this.state.activeTab === tab
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab === 'spec' && 'epos.json'}
              {tab === 'sources' && 'Sources'}
              {tab === 'assets' && 'Assets'}
              {tab === 'manifest' && 'Manifest'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {this.state.activeTab === 'spec' && <this.SpecTabView />}
          {this.state.activeTab === 'manifest' && <this.ManifestTabView />}
          {this.state.activeTab === 'assets' && <this.AssetsTabView />}
          {this.state.activeTab === 'sources' && <this.SourcesTabView />}
        </div>

        {/* Footer with controls */}
        <div className="flex flex-col gap-4 border-t pt-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              {/* Toggles */}
              <Label className="flex items-center gap-3">
                <div className="text-sm font-medium">Enabled</div>
                <Switch checked={this.enabled} onCheckedChange={() => this.toggleEnabled()} />
              </Label>

              <Separator orientation="vertical" className="h-6" />

              <Label className="flex items-center gap-3">
                <div className="text-sm font-medium">Debug</div>
                <Switch checked={this.debug} onCheckedChange={() => this.toggleDebug()} />
              </Label>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => (this.state.showExportDialog = true)}>
                <IconDownload className="mr-1 size-4" />
                Export
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => this.remove()}
                className="text-destructive hover:text-destructive"
              >
                <IconTrash className="mr-1 size-4" />
                Remove
              </Button>
            </div>
          </div>
        </div>

        {/* Export Dialog */}
        <Sheet open={this.state.showExportDialog} onOpenChange={opened => (this.state.showExportDialog = opened)}>
          <SheetContent side="right" className="flex w-full flex-col overflow-hidden sm:max-w-2xl">
            <SheetHeader>
              <SheetTitle>Export Project</SheetTitle>
              <SheetDescription>
                Review the contents before exporting {this.spec.slug}-{this.spec.version}.zip
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-4 overflow-auto">
              {/* Unminified sources warning */}
              {this.hasUnminifiedSources() && (
                <Alert variant="warning" className="border-yellow-500/50 bg-yellow-500/5">
                  <IconAlertCircle className="size-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700">
                    <p className="font-medium">Sources are not minified</p>
                    <p className="mt-1 text-xs">Consider minifying your sources before exporting for production use.</p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Manifest */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Manifest</h3>
                <pre className="max-h-40 overflow-auto rounded bg-muted p-3 text-xs">
                  {JSON.stringify(this.manifest, null, 2)}
                </pre>
              </div>

              <Separator />

              {/* Assets */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Assets ({this.spec.assets.length})</h3>
                <div className="space-y-1 text-xs">
                  {this.spec.assets.length === 0 ? (
                    <p className="text-muted-foreground">No assets</p>
                  ) : (
                    <>
                      {this.spec.assets.map(path => (
                        <div key={path} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1">
                          <code className="text-muted-foreground">{path}</code>
                          <span className="font-medium">
                            {this.assetsInfo[path] ? `${(this.assetsInfo[path].size / 1024).toFixed(2)} KB` : '—'}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between border-t px-2 py-2 text-xs font-medium">
                        <span>Total Assets</span>
                        <span>
                          {(Object.values(this.assetsInfo).reduce((acc, info) => acc + info.size, 0) / 1024).toFixed(2)} KB
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Sources */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Sources ({Object.keys(this.sourcesInfo).length})</h3>
                <div className="space-y-1 text-xs">
                  {Object.keys(this.sourcesInfo).length === 0 ? (
                    <p className="text-muted-foreground">No sources</p>
                  ) : (
                    <>
                      {Object.keys(this.sourcesInfo).map(path => (
                        <div key={path} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1">
                          <code className="text-muted-foreground">{path}</code>
                          <span className="font-medium">
                            {this.sourcesInfo[path] ? `${(this.sourcesInfo[path].size / 1024).toFixed(2)} KB` : '—'}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between border-t px-2 py-2 text-xs font-medium">
                        <span>Total Sources</span>
                        <span>
                          {(Object.values(this.sourcesInfo).reduce((acc, info) => acc + info.size, 0) / 1024).toFixed(2)} KB
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => (this.state.showExportDialog = false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  this.export()
                  this.state.showExportDialog = false
                }}
                className="flex-1"
              >
                <IconDownload className="mr-1 size-4" />
                Export Now
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  SpecTabView() {
    return (
      <div className="h-full overflow-hidden">
        {this.specText ? (
          <pre className="h-full overflow-auto rounded border bg-muted p-4 font-mono text-xs">{this.specText}</pre>
        ) : (
          <div className="rounded bg-muted/50 p-4 text-sm text-muted-foreground">No epos.json loaded</div>
        )}
      </div>
    )
  }

  ManifestTabView() {
    return (
      <div className="h-full overflow-hidden">
        <pre className="h-full overflow-auto rounded border bg-muted p-4 font-mono text-xs">
          {JSON.stringify(this.manifest, null, 2)}
        </pre>
      </div>
    )
  }

  AssetsTabView() {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {this.spec.assets.length === 0 ? (
          <div className="rounded bg-muted/50 p-4 text-sm text-muted-foreground">No assets in this project</div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-muted/50">
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Path</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Size</th>
                </tr>
              </thead>
              <tbody>
                {this.spec.assets.map(path => (
                  <tr key={path} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-2 font-mono text-xs text-foreground">{path}</td>
                    <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                      {this.assetsInfo[path] ? `${(this.assetsInfo[path].size / 1024).toFixed(2)} KB` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-border bg-muted/30">
                <tr>
                  <td className="px-4 py-2 text-xs font-medium">Total Assets</td>
                  <td className="px-4 py-2 text-right text-xs font-medium">
                    {(Object.values(this.assetsInfo).reduce((acc, info) => acc + info.size, 0) / 1024).toFixed(2)} KB
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    )
  }

  SourcesTabView() {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {Object.keys(this.sourcesInfo).length === 0 ? (
          <div className="rounded bg-muted/50 p-4 text-sm text-muted-foreground">No sources in this project</div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-muted/50">
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Path</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Size</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(this.sourcesInfo).map(path => (
                  <tr key={path} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-2 font-mono text-xs text-foreground">{path}</td>
                    <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                      {this.sourcesInfo[path] ? `${(this.sourcesInfo[path].size / 1024).toFixed(2)} KB` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-border bg-muted/30">
                <tr>
                  <td className="px-4 py-2 text-xs font-medium">Total Sources</td>
                  <td className="px-4 py-2 text-right text-xs font-medium">
                    {(Object.values(this.sourcesInfo).reduce((acc, info) => acc + info.size, 0) / 1024).toFixed(2)} KB
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    )
  }

  SidebarView() {
    if (this.spec.slug === 'kit') return null
    return (
      <SidebarMenuItem>
        <SidebarMenuButton isActive={this.selected} onClick={() => this.select()}>
          <IconPointFilled
            className={cn('text-green-500', this.state.error && 'text-red-500', !this.enabled && 'text-gray-500')}
          />
          <div className="truncate">{this.spec.name}</div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  static versioner = this.defineVersioner({
    1(this: any) {
      this.fs = {}
      this.handleId = null
    },
    2(this: any) {
      delete this.handleId
      this.handle = null
    },
    4(this: any) {
      delete this.handle
      this.handle = null
    },
    6() {
      this.specText = null
    },
    7() {
      this.assetsInfo = {}
    },
    8() {
      this.sourcesInfo = {}
    },
    9(this: any) {
      this.exporter = {}
    },
    10(this: any) {
      delete this.exporter
    },
    11(this: any) {
      delete this.mode
      this.debug = false
    },
    12(this: any) {
      this.manifest = null
    },
    13() {},
  })
}
