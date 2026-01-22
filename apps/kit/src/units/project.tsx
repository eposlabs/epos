import { IconPointFilled } from '@tabler/icons-react'
import { Button } from '@ui/components/ui/button'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@ui/components/ui/item'
import { Separator } from '@ui/components/ui/separator.js'
import { SidebarMenuButton, SidebarMenuItem } from '@ui/components/ui/sidebar'
import { Spinner } from '@ui/components/ui/spinner'
import { cn } from '@ui/lib/utils'
import type { Assets, ProjectBase, Sources, Spec } from 'epos'

export class Project extends gl.Unit {
  debug: boolean
  enabled: boolean
  spec: Spec
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
    }
  }

  constructor(parent: gl.Unit, params: ProjectBase) {
    super(parent)
    this.id = params.id
    this.debug = params.debug
    this.spec = params.spec
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
    this.spec = updates.spec
    this.enabled = updates.enabled
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
      const assets: Assets = {}
      for (const path of spec.assets) {
        const file = await this.readFile(path)
        assets[path] = file
        this.assetsInfo[path] = { size: file.size }
      }

      // Read sources
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

  private async export() {
    const debug = false // TODO: e.shift
    const files = await epos.projects.export(this.id, debug)
    const zip = await this.$.utils.zip(files)
    const url = URL.createObjectURL(zip)
    const filename = `${this.spec.slug}-${this.spec.version}.zip`
    await epos.browser.downloads.download({ url, filename })
    URL.revokeObjectURL(url)
  }

  View() {
    if (!this.state.ready) return <this.LoadingView />
    return (
      <div className="flex gap-4 p-4">
        <this.DataView />
        <this.ActionsView />
      </div>
    )
  }

  LoadingView() {
    return (
      <div className="flex size-full items-center justify-center">
        <Spinner />
      </div>
    )
  }

  DataView() {
    return (
      <div className="w-120 space-y-2">
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>ID</ItemTitle>
            <ItemDescription>{this.id}</ItemDescription>
          </ItemContent>
        </Item>

        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Enabled</ItemTitle>
            <ItemDescription>{this.enabled.toString()}</ItemDescription>
          </ItemContent>
          <ItemActions></ItemActions>
        </Item>

        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Debug</ItemTitle>
            <ItemDescription>{String(this.debug)}</ItemDescription>
          </ItemContent>
          <ItemActions></ItemActions>
        </Item>

        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Error</ItemTitle>
            <ItemDescription>{this.state.error ? this.state.error.message : '—'}</ItemDescription>
            {!!this.state.error?.cause && <div className="text-muted-foreground">{String(this.state.error.cause)}</div>}
          </ItemContent>
        </Item>

        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Directory</ItemTitle>
            <ItemDescription>{this.state.handle ? `./${this.state.handle.name}` : 'not connected'}</ItemDescription>
          </ItemContent>
        </Item>

        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Observers</ItemTitle>
            <pre className="text-muted-foreground">{this.state.observers.length}</pre>
          </ItemContent>
        </Item>

        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Assets</ItemTitle>
            <div className="space-y-1">
              {this.spec.assets.length === 0 && <div className="text-muted-foreground">—</div>}
              {this.spec.assets.map(path => (
                <div key={path} className="flex justify-between">
                  <div>{path}</div>
                  <div className="text-muted-foreground">
                    {this.assetsInfo[path] ? `${(this.assetsInfo[path].size / 1024).toFixed(2)} KB` : '—'}
                  </div>
                </div>
              ))}

              <Separator className="my-2 opacity-50" />

              <div className="flex justify-between">
                <div>Total:</div>
                <div className="text-muted-foreground">
                  {(Object.values(this.assetsInfo).reduce((acc, info) => acc + info.size, 0) / 1024).toFixed(2)} KB
                </div>
              </div>
            </div>
          </ItemContent>
        </Item>

        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Sources</ItemTitle>
            <div className="space-y-1">
              {Object.keys(this.sourcesInfo).length === 0 && <div className="text-muted-foreground">—</div>}

              {Object.keys(this.sourcesInfo).map(path => (
                <div key={path} className="flex justify-between">
                  <div>{path}</div>
                  <div className="text-muted-foreground">
                    {this.sourcesInfo[path] ? `${(this.sourcesInfo[path]!.size / 1024).toFixed(2)} KB` : '—'}
                  </div>
                </div>
              ))}

              <Separator className="my-2 opacity-50" />

              <div className="flex justify-between">
                <div>Total:</div>
                <div className="text-muted-foreground">
                  {(Object.values(this.sourcesInfo).reduce((acc, info) => acc + info.size, 0) / 1024).toFixed(2)} KB
                </div>
              </div>
            </div>
          </ItemContent>
        </Item>

        <Item variant="outline">
          <ItemContent>
            <ItemTitle>epos.json</ItemTitle>
            <pre className="text-muted-foreground">{this.specText ?? '—'}</pre>
          </ItemContent>
        </Item>
      </div>
    )
  }

  ActionsView() {
    return (
      <div className="flex flex-col items-start gap-2">
        <Button variant="outline" size="sm" onClick={this.export}>
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={this.toggleEnabled}>
          Toggle enabled
        </Button>
        <Button variant="outline" size="sm" onClick={this.toggleDebug}>
          Toggle debug
        </Button>
        <Button variant="outline" size="sm" onClick={this.connectDir}>
          Connect dir
        </Button>
        <Button variant="outline" size="sm" onClick={this.disconnectDir}>
          Disconnect dir
        </Button>
        <Button variant="outline" size="sm" onClick={this.observe}>
          Start observer
        </Button>
        <Button variant="outline" size="sm" onClick={this.unobserve}>
          Stop observer
        </Button>
        <Button variant="outline" size="sm" onClick={() => this.remove()}>
          Remove
        </Button>
      </div>
    )
  }

  SidebarView() {
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
  })
}
