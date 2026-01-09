import { IconPointFilled } from '@tabler/icons-react'
import { Button } from '@ui/components/ui/button'
import { Label } from '@ui/components/ui/label'
import { SidebarMenuButton, SidebarMenuItem } from '@ui/components/ui/sidebar'
import { Switch } from '@ui/components/ui/switch'
import { cn } from '@ui/lib/utils'
import { type Project as Data } from 'epos'

export class Project extends gl.Unit {
  fs = new gl.ProjectFs(this)
  mode: Data['mode']
  spec: Data['spec']
  enabled: Data['enabled']
  handle: { id: string; name: string } | null = null

  get static(): {
    handle: FileSystemDirectoryHandle | null
  } {
    return {
      handle: null,
    }
  }

  private get $projects() {
    return this.closest(gl.Projects)!
  }

  get selected() {
    return this.$projects.selectedProjectId === this.id
  }

  constructor(parent: gl.Unit, data: Data) {
    super(parent)
    this.id = data.id
    this.mode = data.mode
    this.spec = data.spec
    this.enabled = data.enabled
  }

  async connectDir() {
    const [dirHandle] = await this.$.utils.safe(() => self.showDirectoryPicker({ mode: 'read' }))
    if (!dirHandle) return

    const handleId = this.$.libs.nanoid()
    await this.$.idb.set('kit', 'handles', handleId, dirHandle)

    this.handle = { id: handleId, name: dirHandle.name }
    this.static.handle = dirHandle
  }

  attach() {
    if (this.handle) {
      // this.static.handle = this.fs.getFileHandle(this.handleId)
    }
  }

  update(updates: Omit<Data, 'id'>) {
    this.mode = updates.mode
    this.spec = updates.spec
    this.enabled = updates.enabled
  }

  async toggle() {
    if (this.spec.name === 'kit') return
    if (this.enabled) {
      await epos.projects.disable(this.id)
    } else {
      await epos.projects.enable(this.id)
    }
  }

  select() {
    this.$projects.selectedProjectId = this.id
  }

  SidebarView() {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton isActive={this.selected} onClick={() => this.select()}>
          <IconPointFilled
            className={cn('text-green-500', false && 'text-red-500', !this.enabled && 'text-gray-500')}
          />
          <div>{this.spec.name}</div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  View() {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center">
          <div>Project {this.spec.name}</div>
          <Label className="flex items-center space-x-2">
            <div>Enabled</div>
            <Switch checked={this.enabled} size="default" onCheckedChange={() => this.toggle()} />
          </Label>
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
