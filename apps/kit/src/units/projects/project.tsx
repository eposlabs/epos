import { IconPointFilled } from '@tabler/icons-react'
import { SidebarMenuButton, SidebarMenuItem } from '@ui/components/ui/sidebar'
import { cn } from '@ui/lib/utils'
import { type Project as Data } from 'epos'

export class Project extends gl.Unit {
  mode: Data['mode']
  spec: Data['spec']
  enabled: Data['enabled']

  constructor(parent: gl.Unit, data: Data) {
    super(parent)
    this.id = data.id
    this.mode = data.mode
    this.spec = data.spec
    this.enabled = data.enabled
  }

  update(updates: Omit<Data, 'id'>) {
    this.mode = updates.mode
    this.spec = updates.spec
    this.enabled = updates.enabled
  }

  async toggle() {
    return
    if (this.enabled) {
      await epos.projects.disable(this.id)
    } else {
      await epos.projects.enable(this.id)
    }
  }

  SidebarView() {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton isActive={false} onClick={this.toggle}>
          <IconPointFilled
            className={cn('text-green-500', false && 'text-red-500', !this.enabled && 'text-gray-500')}
          />
          <div>{this.spec.name}</div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }
}
