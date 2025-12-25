import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar'
import { IconPlus } from '@tabler/icons-react'

export class Projects extends gl.Unit {
  list: gl.Project[] = []
  selectedProjectName = 'lingolock'

  async init() {
    await this.deleteOrphanedHandles()
  }

  /** Delete handles from IDB that do not have corresponding projects. */
  private async deleteOrphanedHandles() {
    // const idbHandleIds = await this.$.idb.keys('kit', 'handles')
    // const projectHandleIds = new Set(this.$.projects.list.map(project => project.handleId))
    // for (const idbHandleId of idbHandleIds) {
    //   if (projectHandleIds.has(idbHandleId)) continue
    //   await this.$.idb.delete('kit', 'handles', idbHandleId)
    // }
  }

  async addProject() {
    // Ask user for a directory handle
    const [handle] = await this.$.utils.safe(() => self.showDirectoryPicker({ mode: 'read' }))
    if (!handle) return

    // Save the handle to IDB
    const handleId = this.$.utils.id()
    await this.$.idb.set('kit', 'handles', handleId, handle)

    // Create new project
    const project = new gl.Project(this, handleId)
    this.list.push(project)

    // TODO: wait till project is ready (data is read), then select it
  }

  View() {
    const project = this.list.find(project => project.selected)
    if (!project) return null
    return (
      <div>
        <project.View />
      </div>
    )
  }

  SidebarView() {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Projects</SidebarGroupLabel>
        <SidebarGroupAction title="Add Project" onClick={this.addProject}>
          <IconPlus /> <span className="sr-only">Add Project</span>
        </SidebarGroupAction>
        <SidebarGroupContent>
          <SidebarMenu>
            {this.list.map(project => (
              <project.SidebarView key={project.handleId} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  // ---------------------------------------------------------------------------
  // VERSIONER
  // ---------------------------------------------------------------------------

  static versioner: any = {
    1() {
      this.selectedProjectName = 'lingolock'
    },
  }
}
