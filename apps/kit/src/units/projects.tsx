import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia } from '@/components/ui/empty.js'
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.js'
import { IconFolder, IconFolderCode, IconPlus } from '@tabler/icons-react'

export class Projects extends gl.Unit {
  dict: { [projectId: string]: gl.Project } = {}
  selectedProjectId: string | null = null
  creation = new gl.ProjectsCreation(this)

  get list() {
    return Object.values(this.dict)
  }

  get selectedProject() {
    if (!this.selectedProjectId) return null
    return this.dict[this.selectedProjectId] ?? null
  }

  async attach() {
    epos.projects.watch(() => this.refreshProjects())
    await this.refreshProjects()
  }

  async addEmptyProject() {
    // Prepare unique project name
    let name = 'New Project'
    let index = 1
    while (this.list.find(project => project.spec.name === name)) {
      index += 1
      name = `New Project ${index}`
    }

    // Create and select the new project
    this.selectedProjectId = await epos.projects.create({
      spec: this.$.libs.parseSpecObject({ name }),
      sources: {},
      assets: {},
      debug: true,
      enabled: true,
    })
  }

  private async refreshProjects() {
    // Get projects data from epos
    const projectsData = await epos.projects.list({ sources: true })

    // Update existing projects and add new ones
    for (const projectData of projectsData) {
      const project = this.dict[projectData.id]
      if (project) {
        project.update(projectData)
      } else {
        this.dict[projectData.id] = new gl.Project(this, projectData)
      }
    }

    // Remove deleted projects
    for (const projectId in this.dict) {
      const exists = projectsData.find(projectData => projectData.id === projectId)
      if (!exists) delete this.dict[projectId]
    }

    // Deselect project if it was removed
    if (this.selectedProjectId && !this.dict[this.selectedProjectId]) {
      this.selectedProjectId = null
    }
  }

  // #endregion
  // #region View
  // ============================================================================

  View() {
    if (this.list.length === 1) return <this.NoProjectsView />
    if (!this.selectedProject) return null
    return <this.selectedProject.View />
  }

  // #endregion
  // #region SidebarView
  // ============================================================================

  SidebarView() {
    if (this.list.length === 1) return null
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Projects</SidebarGroupLabel>
        <DropdownMenu>
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <SidebarGroupAction title="Add Project">
                  <IconPlus /> <span className="sr-only">Add Project</span>
                </SidebarGroupAction>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Add project</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-max">
            <DropdownMenuItem onClick={() => this.creation.openCreate()} className="whitespace-nowrap">
              <IconPlus />
              New project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => this.creation.openConnect()} className="whitespace-nowrap">
              <IconFolder />
              Connect existing project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <SidebarGroupContent>
          <SidebarMenu className="gap-1">
            {this.list.map(project => (
              <project.SidebarView key={project.id} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  // #endregion
  // #region NoProjectsView
  // ============================================================================

  NoProjectsView() {
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
          <Button onClick={this.addEmptyProject}>Create Project</Button>
        </EmptyContent>
      </Empty>
    )
  }

  // #endregion
  // #region Versioner
  // ============================================================================

  static versioner = this.defineVersioner({
    1(this: any) {
      this.list = []
    },
    2() {
      this.selectedProjectId = null
    },
    4(this: any) {
      delete this.list
      this.dict = {}
    },
    5() {
      this.creation = new gl.ProjectsCreation(this)
    },
  })

  // #endregion
  // #region
  // ============================================================================
}
