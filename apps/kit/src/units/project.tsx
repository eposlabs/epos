import { IconPointFilled } from '@tabler/icons-react'
import { Button } from '@ui/components/ui/button'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@ui/components/ui/item'
import { SidebarMenuButton, SidebarMenuItem } from '@ui/components/ui/sidebar'
import { Spinner } from '@ui/components/ui/spinner'
import { cn } from '@ui/lib/utils'
import type { Assets, Bundle, Mode, ProjectBase, Sources, Spec } from 'epos'

export class Project extends gl.Unit {
  mode: Mode
  spec: Spec
  enabled: boolean

  get state() {
    return {
      ready: false,
      updating: false,
      error: null as Error | null,
      observers: [] as FileSystemObserver[],
      rootDirHandle: null as FileSystemDirectoryHandle | null,
    }
  }

  constructor(parent: gl.Unit, params: ProjectBase) {
    super(parent)
    this.id = params.id
    this.mode = params.mode
    this.spec = params.spec
    this.enabled = params.enabled
  }

  async attach() {
    const rootDirHandle = await this.$.idb.get<FileSystemDirectoryHandle>('kit', 'handles', this.id)
    if (rootDirHandle) this.setRootDirHandle(rootDirHandle)
    this.state.ready = true
  }

  async detach() {
    await this.$.idb.delete('kit', 'handles', this.id)
    this.stopObserver()
  }

  private get $projects() {
    return this.closest(gl.Projects)!
  }

  get selected() {
    return this.$projects.selectedProjectId === this.id
  }

  get usedPaths() {
    return [
      'epos.json',
      ...this.spec.assets,
      ...this.spec.targets.flatMap(target => target.resources.map(resource => resource.path)),
    ]
  }

  update(updates: Omit<ProjectBase, 'id'>) {
    this.mode = updates.mode
    this.spec = updates.spec
    this.enabled = updates.enabled
  }

  select() {
    this.$projects.selectedProjectId = this.id
  }

  async toggleEnabled() {
    await epos.projects.update(this.id, { enabled: !this.enabled })
  }

  async toggleMode() {
    const newMode: Mode = this.mode === 'development' ? 'production' : 'development'
    await epos.projects.update(this.id, { mode: newMode })
  }

  async remove() {
    await epos.projects.remove(this.id)
  }

  async connectDir() {
    const [rootDirHandle] = await this.$.utils.safe(() => showDirectoryPicker({ mode: 'read' }))
    if (!rootDirHandle) return
    await this.$.idb.set('kit', 'handles', this.id, rootDirHandle)
    this.setRootDirHandle(rootDirHandle)
  }

  async disconnect() {
    await this.$.idb.delete('kit', 'handles', this.id)
    this.state.rootDirHandle = null
    this.stopObserver()
  }

  private async setRootDirHandle(dirHandle: FileSystemDirectoryHandle) {
    this.state.rootDirHandle = dirHandle
    await this.hydrate()
    this.startObserver()
  }

  private async startObserver() {
    if (!this.state.rootDirHandle) return
    if (this.state.observers.length > 0) return

    let hydrateTimer = -1

    for (const path of this.usedPaths) {
      const handle = await this.getFileHandle(path)
      const observer = new FileSystemObserver(() => {
        clearTimeout(hydrateTimer)
        hydrateTimer = setTimeout(() => this.hydrate())
      })

      observer.observe(handle)
      this.state.observers.push(observer)
    }
  }

  private stopObserver() {
    if (this.state.observers.length === 0) return
    for (const observer of this.state.observers) observer.disconnect()
    this.state.observers = []
  }

  private async hydrate() {
    try {
      this.state.error = null
      this.state.updating = true
      const bundle = await this.readBundle()
      await epos.projects.update(this.id, bundle)
    } catch (e) {
      this.state.error = this.$.utils.is.error(e) ? e : new Error(String(e))
    } finally {
      this.state.updating = false
    }
  }

  private async readBundle() {
    const [specHandle] = await this.$.utils.safe(() => this.getFileHandle('epos.json'))
    if (!specHandle) throw new Error('epos.json not found')

    const [specFile, fileError] = await this.$.utils.safe(() => specHandle.getFile())
    if (fileError) throw new Error('Failed to read epos.json', { cause: String(fileError) })

    const [specJson, jsonError] = await this.$.utils.safe(() => specFile.text())
    if (jsonError) throw new Error('Failed to read epos.json', { cause: String(jsonError) })

    const [spec, specError] = this.$.utils.safeSync(() => this.$.libs.parseSpecJson(specJson))
    if (specError) throw new Error('Failed to parse epos.json', { cause: String(specError) })

    const assets: Assets = {}
    for (const path of spec.assets) {
      assets[path] = await this.readFile(path)
    }

    const sources: Sources = {}
    for (const target of spec.targets) {
      for (const resource of target.resources) {
        if (sources[resource.path]) continue
        sources[resource.path] = await this.readFileAsText(resource.path)
      }
    }

    const bundle: Bundle = { spec, sources, assets }
    return bundle
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
    if (!this.state.rootDirHandle) throw this.never()
    let dirHandle = this.state.rootDirHandle
    for (const dir of dirs) {
      const [nextDirHandle] = await this.$.utils.safe(dirHandle.getDirectoryHandle(dir))
      if (!nextDirHandle) throw new Error(`File not found: ${path}`)
      dirHandle = nextDirHandle
    }

    // Get file handle
    const [fileHandle] = await this.$.utils.safe(dirHandle.getFileHandle(name))
    if (!fileHandle) throw new Error(`File not found: ${path}`)

    return fileHandle
  }

  // ---------------------------------------------------------------------------
  // VIEW
  // ---------------------------------------------------------------------------

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
            <ItemTitle>Mode</ItemTitle>
            <ItemDescription>{this.mode}</ItemDescription>
          </ItemContent>
          <ItemActions></ItemActions>
        </Item>

        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Error</ItemTitle>
            <ItemDescription>{this.state.error ? this.state.error.message : '—'}</ItemDescription>
            {!!this.state.error?.cause && (
              <div className="text-muted-foreground">{String(this.state.error.cause)}</div>
            )}
          </ItemContent>
        </Item>

        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Directory</ItemTitle>
            <ItemDescription>
              {this.state.rootDirHandle ? `./${this.state.rootDirHandle.name}` : 'not connected'}
            </ItemDescription>
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
            <ItemTitle>Spec</ItemTitle>
            <pre className="text-muted-foreground">{JSON.stringify(this.spec, null, 2)}</pre>
          </ItemContent>
        </Item>
      </div>
    )
  }

  ActionsView() {
    return (
      <div className="flex flex-col items-start gap-2">
        <Button variant="outline" size="sm" onClick={this.toggleEnabled}>
          Toggle enabled
        </Button>
        <Button variant="outline" size="sm" onClick={this.toggleMode}>
          Toggle mode
        </Button>
        <Button variant="outline" size="sm" onClick={this.connectDir}>
          Connect dir
        </Button>
        <Button variant="outline" size="sm" onClick={this.disconnect}>
          Disconnect dir
        </Button>
        <Button variant="outline" size="sm" onClick={this.startObserver}>
          Start observer
        </Button>
        <Button variant="outline" size="sm" onClick={this.stopObserver}>
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
            className={cn(
              'text-green-500',
              this.state.error && 'text-red-500',
              !this.enabled && 'text-gray-500',
            )}
          />
          <div className="truncate">{this.spec.name}</div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  // ---------------------------------------------------------------------------
  // VERSIONER
  // ---------------------------------------------------------------------------

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
      this.rootDirHandle = null
    },
  })
}
