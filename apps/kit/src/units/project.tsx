import { IconPointFilled } from '@tabler/icons-react'
import { Button } from '@ui/components/ui/button'
import { Label } from '@ui/components/ui/label'
import { SidebarMenuButton, SidebarMenuItem } from '@ui/components/ui/sidebar'
import { Switch } from '@ui/components/ui/switch'
import { cn } from '@ui/lib/utils'
import type { ProjectMode, ProjectSpec } from 'epos'

export class Project extends gl.Unit {
  mode: ProjectMode
  spec: ProjectSpec
  enabled: boolean
  handle: { id: string; name: string } | null = null
  fs = new gl.ProjectFs(this)

  get state() {
    return {
      error: null as string | null,
      updating: false,
    }
  }

  get static() {
    return {
      handle: null as FileSystemDirectoryHandle | null,
      observer: null as FileSystemObserver | null,
      updateTimer: -1,
    }
  }

  private get $projects() {
    return this.closest(gl.Projects)!
  }

  get selected() {
    return this.$projects.selectedProjectId === this.id
  }

  constructor(parent: gl.Unit, spec: ProjectSpec) {
    super(parent)
    this.mode = 'development'
    this.enabled = true
  }

  async connectDir() {
    const [dirHandle] = await this.$.utils.safe(() => self.showDirectoryPicker({ mode: 'read' }))
    if (!dirHandle) return

    const handleId = this.$.libs.nanoid()
    await this.$.idb.set('kit', 'handles', handleId, dirHandle)

    this.handle = { id: handleId, name: dirHandle.name }
    this.static.handle = dirHandle

    this.startObserver()
    await this.updateFromFs()
  }

  async attach() {
    if (this.handle) {
      this.static.handle = await this.$.idb.get<FileSystemDirectoryHandle>('kit', 'handles', this.handle.id)
      if (this.static.handle) {
        this.startObserver()
        await this.updateFromFs()
      }
    }
  }

  async detach() {
    this.stopObserver()
  }

  update(updates: Omit<ProjectBase, 'id'>) {
    this.mode = updates.mode
    this.spec = updates.spec
    this.enabled = updates.enabled
  }

  async toggle() {
    await epos.projects.update(this.id, { enabled: !this.enabled })
  }

  async updateFromFs() {
    try {
      this.state.error = null
      this.state.updating = true

      const bundle = await this.readBundle()
      this.spec = bundle.spec

      await epos.projects.update(this.id, bundle)
    } catch (e) {
      this.state.error = this.$.utils.is.error(e) ? String(e.message ?? e) : String(e)
    } finally {
      this.state.updating = false
    }
  }

  select() {
    this.$projects.selectedProjectId = this.id
  }

  async remove() {
    this.stopObserver()
    await epos.projects.remove(this.id)
  }

  private startObserver() {
    if (!this.static.handle) return

    this.static.observer = new FileSystemObserver(records => {
      if (this.state.error) {
        this.updateWithDelay()
        return
      }

      for (const record of records) {
        const path = record.relativePathComponents.join('/')
        if (this.usesPath(path)) {
          this.updateWithDelay()
          return
        }
      }
    })

    this.static.observer.observe(this.static.handle, { recursive: true })
  }

  private stopObserver() {
    if (this.static.observer) {
      this.static.observer.disconnect()
      this.static.observer = null
    }
    self.clearTimeout(this.static.updateTimer)
  }

  private updateWithDelay() {
    self.clearTimeout(this.static.updateTimer)
    this.static.updateTimer = self.setTimeout(() => this.updateFromFs(), 50)
  }

  private usesPath(path: string) {
    if (path === 'epos.json') return true
    if (!this.spec) return false

    for (const assetPath of this.spec.assets) {
      if (path === assetPath) return true
    }

    for (const target of this.spec.targets) {
      for (const resource of target.resources) {
        if (path === resource.path) return true
      }
    }

    return false
  }

  // Build a bundle by reading spec, sources and assets from the connected directory
  private async readBundle(): Promise<ProjectBundle> {
    const [specHandle] = await this.$.utils.safe(() => this.fs.getFileHandle('epos.json'))
    if (!specHandle) throw new Error('epos.json not found')

    const [specFile, fileError] = await this.$.utils.safe(() => specHandle.getFile())
    if (fileError) throw new Error('Failed to read epos.json', { cause: String(fileError) })

    const [specJson, jsonError] = await this.$.utils.safe(() => specFile.text())
    if (jsonError) throw new Error('Failed to read epos.json', { cause: String(jsonError) })

    const [specObj, objError] = this.$.utils.safeSync(() => JSON.parse(specJson))
    if (objError) throw new Error('Failed to parse epos.json', { cause: String(objError) })
    const spec = this.$.libs.eposSpec.parseObject(specObj)

    const assets: Record<string, Blob> = {}
    for (const path of spec.assets) {
      assets[path] = await this.fs.readFile(path)
    }

    const sources: Record<string, string> = {}
    for (const target of spec.targets) {
      for (const resource of target.resources) {
        if (sources[resource.path]) continue
        sources[resource.path] = await this.fs.readFileAsText(resource.path)
      }
    }

    return { spec, sources, assets }
  }

  SidebarView() {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton isActive={this.selected} onClick={() => this.select()}>
          <IconPointFilled
            className={cn('text-green-500', false && 'text-red-500', !this.enabled && 'text-gray-500')}
          />
          <div className="flex w-full min-w-0 justify-between gap-2">
            <div className="truncate">{this.spec.name}</div>
            <div className="text-neutral-300 dark:text-neutral-700">{this.id}</div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  View() {
    const hideToggle = this.spec.name === '[epos]'

    return (
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            Project {this.spec.name} [{this.mode}] <span className="text-gray-400">{this.id}</span>
          </div>
          {!hideToggle && (
            <Label className="flex items-center space-x-2">
              <div>Enabled</div>
              <Switch checked={this.enabled} size="default" onCheckedChange={() => this.toggle()} />
            </Label>
          )}
        </div>
        <div>
          {!this.handle && (
            <Button className="mt-4" onClick={() => this.connectDir()}>
              Connect Directory
            </Button>
          )}
          {this.handle && (
            <div>
              <div className="mt-4 text-sm text-gray-500">
                Directory connected: [{this.handle.name}] [{this.handle.id}]
              </div>
              <Button className="mt-2" onClick={() => this.connectDir()}>
                Reconnect Directory
              </Button>
            </div>
          )}
        </div>
        <Button variant="outline" onClick={() => this.remove()}>
          REMOVE
        </Button>
      </div>
    )
  }

  get versioner() {
    return {
      1: () => {
        this.fs = new gl.ProjectFs(this)
        // @ts-ignore
        this.handleId = null
      },
      2: () => {
        Reflect.deleteProperty(this, 'handleId')
        this.handle = null
      },
      3: () => {},
    }
  }
}
