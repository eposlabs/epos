import { IconPointFilled } from '@tabler/icons-react'
import { Button } from '@ui/components/ui/button'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@ui/components/ui/item'
import { SidebarMenuButton, SidebarMenuItem } from '@ui/components/ui/sidebar'
import { cn } from '@ui/lib/utils'
import type { Assets, Bundle, Mode, ProjectBase, Sources, Spec } from 'epos'

// TODO: instead of handleid, use this.id (?)
export class Project extends gl.Unit {
  mode: Mode
  spec: Spec
  enabled: boolean
  dir: { handleId: string; name: string } | null = null
  fs = new gl.ProjectFs(this)

  get state() {
    return {
      error: null as { message: string; details: string | null } | null,
      updating: false,
    }
  }

  get inert() {
    return {
      rootDirHandle: null as FileSystemDirectoryHandle | null,
      rootDirObserver: null as FileSystemObserver | null,
      updateTimer: -1,
    }
  }

  // ---------------------------------------------------------------------------
  // LIFECYCLE
  // ---------------------------------------------------------------------------

  constructor(parent: gl.Unit, params: ProjectBase) {
    super(parent)
    this.id = params.id
    this.mode = params.mode
    this.spec = params.spec
    this.enabled = params.enabled
  }

  async attach() {
    if (this.dir) {
      const rootDirHandle = await this.$.idb.get<FileSystemDirectoryHandle>(
        'kit',
        'handles',
        this.dir.handleId,
      )
      if (!rootDirHandle) {
        this.dir = null
      } else {
        this.inert.rootDirHandle = rootDirHandle
      }
    }

    this.updateFromFs()
    this.startObserver()
    // if (this.handle) {
    //   this.inert.handle = await this.$.idb.get<FileSystemDirectoryHandle>('kit', 'handles', this.handle.id)
    //   if (this.inert.handle) {
    //     this.startObserver()
    //     await this.updateFromFs()
    //   }
    // }
  }

  async detach() {
    this.stopObserver()
  }

  // ---------------------------------------------------------------------------
  // PROPS
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------------------

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
    this.stopObserver()
    await epos.projects.remove(this.id)
  }

  async connectDir() {
    const [rootDirHandle] = await this.$.utils.safe(() => self.showDirectoryPicker({ mode: 'read' }))
    if (!rootDirHandle) return

    const rootDirHandleId = this.$.libs.nanoid()
    await this.$.idb.set('kit', 'handles', rootDirHandleId, rootDirHandle)
    this.dir = { handleId: rootDirHandleId, name: rootDirHandle.name }
    this.inert.rootDirHandle = rootDirHandle

    this.startObserver()
    await this.updateFromFs()
  }

  async startObserver() {
    if (!this.inert.rootDirHandle) return
    if (this.inert.rootDirObserver) return

    this.inert.rootDirObserver = new FileSystemObserver(records => {
      if (this.state.error) {
        this.updateWithDelay()
        return
      }

      for (const record of records) {
        const path = record.relativePathComponents.join('/')
        if (this.usedPaths.includes(path)) {
          this.updateFromFs()
          // this.updateWithDelay()
          return
        }
      }
    })

    this.inert.rootDirObserver.observe(this.inert.rootDirHandle, { recursive: true })
  }

  async stopObserver() {
    if (!this.inert.rootDirObserver) return
    this.inert.rootDirObserver.disconnect()
    this.inert.rootDirObserver = null
  }

  // ---------------------------------------------------------------------------
  // GENERAL
  // ---------------------------------------------------------------------------

  update(updates: Omit<ProjectBase, 'id'>) {
    this.mode = updates.mode
    this.spec = updates.spec
    this.enabled = updates.enabled
  }

  async updateFromFs() {
    try {
      this.state.error = null
      this.state.updating = true

      const bundle = await this.readBundle()
      this.spec = bundle.spec

      await epos.projects.update(this.id, bundle)
    } catch (e) {
      this.state.error = {
        message: this.$.utils.is.error(e) ? String(e.message ?? e) : String(e),
        details: this.$.utils.is.error(e) && e.cause ? String(e.cause) : null,
      }
    } finally {
      this.state.updating = false
    }
  }

  private async readBundle() {
    const [specHandle] = await this.$.utils.safe(() => this.fs.getFileHandle('epos.json'))
    if (!specHandle) throw new Error('epos.json not found')

    const [specFile, fileError] = await this.$.utils.safe(() => specHandle.getFile())
    if (fileError) throw new Error('Failed to read epos.json', { cause: String(fileError) })

    const [specJson, jsonError] = await this.$.utils.safe(() => specFile.text())
    if (jsonError) throw new Error('Failed to read epos.json', { cause: String(jsonError) })

    const [spec, specError] = this.$.utils.safeSync(() => this.$.libs.parseSpecJson(specJson))
    if (specError) throw new Error('Failed to parse epos.json', { cause: String(specError) })

    const assets: Assets = {}
    for (const path of spec.assets) {
      assets[path] = await this.fs.readFile(path)
    }

    const sources: Sources = {}
    for (const target of spec.targets) {
      for (const resource of target.resources) {
        if (sources[resource.path]) continue
        sources[resource.path] = await this.fs.readFileAsText(resource.path)
      }
    }

    const bundle: Bundle = { spec, sources, assets }
    return bundle
  }

  // ---------------------------------------------------------------------------
  // TODO
  // ---------------------------------------------------------------------------

  // private _startObserver() {
  //   this.inert.observer = new FileSystemObserver(records => {
  //     if (this.state.error) {
  //       this.updateWithDelay()
  //       return
  //     }

  //     for (const record of records) {
  //       const path = record.relativePathComponents.join('/')
  //       if (this.usedPaths.includes(path)) {
  //         this.updateWithDelay()
  //         return
  //       }
  //     }
  //   })

  //   this.inert.observer.observe(this.inert.handle, { recursive: true })
  // }

  // private _stopRootDirObserver() {
  //   if (this.inert.observer) {
  //     this.inert.observer.disconnect()
  //     this.inert.observer = null
  //   }
  //   self.clearTimeout(this.inert.updateTimer)
  // }

  private updateWithDelay() {
    self.clearTimeout(this.inert.updateTimer)
    this.inert.updateTimer = self.setTimeout(() => this.updateFromFs(), 50)
  }

  // ---------------------------------------------------------------------------
  // VIEW
  // ---------------------------------------------------------------------------

  View() {
    return (
      <div className="flex gap-4 p-4">
        <this.DataView />
        <this.ActionsView />
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
            {this.state.error?.details && (
              <div className="text-muted-foreground">{this.state.error.details}</div>
            )}
          </ItemContent>
        </Item>

        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Directory</ItemTitle>
            <ItemDescription>{this.dir ? `./${this.dir.name}` : 'not connected'}</ItemDescription>
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
            className={cn('text-green-500', false && 'text-red-500', !this.enabled && 'text-gray-500')}
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
      this.fs = new gl.ProjectFs(this)
      this.handleId = null
    },
    2(this: any) {
      delete this.handleId
      this.handle = null
    },
    3() {},
    4(this: any) {
      delete this.handle
      this.rootDirHandle = null
    },
  })
}
