import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia } from '@/components/ui/empty.js'
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.js'
import { IconFolderCode, IconPlus } from '@tabler/icons-react'

export class ProjectsUi extends gl.Unit {
  get self() {
    return this.closest(gl.Projects)!
  }

  // MARK: View
  // ============================================================================

  View() {
    if (this.self.list.length === 1) return <this.NoProjectsView />
    if (!this.self.selectedProject) return null
    return <this.self.selectedProject.View />
  }

  // MARK: SidebarView
  // ============================================================================

  SidebarView() {
    if (this.self.list.length === 1) return null
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Projects</SidebarGroupLabel>
        <Tooltip delayDuration={400}>
          <TooltipTrigger asChild>
            <SidebarGroupAction title="Add Project" onClick={() => this.self.addEmptyProject()}>
              <IconPlus /> <span className="sr-only">Add Project</span>
            </SidebarGroupAction>
          </TooltipTrigger>
          <TooltipContent>Add project</TooltipContent>
        </Tooltip>
        <SidebarGroupContent>
          <SidebarMenu className="gap-1">
            {this.self.list.map(project => (
              <project.SidebarView key={project.id} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  // MARK: NoProjectsView
  // ============================================================================

  private NoProjectsView() {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <IconFolderCode />
          </EmptyMedia>
          <EmptyDescription>
            You haven't created any projects yet. Get started by creating your first project.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-2">
          <Button onClick={this.self.addEmptyProject}>Create Project</Button>
        </EmptyContent>
      </Empty>
    )
  }
}
