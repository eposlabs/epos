import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar.js'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.js'
import { Plus } from 'lucide-react'

export class Projects extends gl.Unit {
  dict: { [projectId: string]: gl.Project } = {}
  selectedId: string | null = null

  get list() {
    return Object.values(this.dict)
  }

  get empty() {
    return this.list.length === 0
  }

  get selected() {
    if (!this.selectedId) return null
    return this.dict[this.selectedId] ?? null
  }

  async init() {
    epos.projects.watch(() => this.refresh())
    await this.refresh()
  }

  async create() {
    // Prepare unique project name
    let index = 1
    let name = 'New Project'
    while (this.list.find(project => project.spec.name === name)) {
      index += 1
      name = `New Project #${index}`
    }

    // Create and select the new project
    this.selectedId = await epos.projects.create({
      spec: this.$.libs.parseSpecObject({ name }),
      sources: {},
      assets: {},
      debug: true,
      enabled: true,
    })
  }

  private async refresh() {
    // Get projects data from epos
    const projectsData = await epos.projects.list({ sources: true })

    // Update existing projects and add new ones
    for (const projectData of projectsData) {
      if (projectData.id === epos.env.project.id) continue
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
    if (this.selectedId && !this.dict[this.selectedId]) {
      this.selectedId = null
    }
  }

  // MARK: Views
  // ============================================================================

  View() {
    if (!this.selected) return null
    return <this.selected.View />
  }

  SidebarView() {
    return (
      <>
        <this.SidebarMainView />
        <this.SidebarEmptyView />
      </>
    )
  }

  private SidebarMainView() {
    if (this.empty) return null
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Projects</SidebarGroupLabel>
        <Tooltip delayDuration={400}>
          <TooltipTrigger asChild>
            <SidebarGroupAction title="Create project" onClick={() => this.create()}>
              <Plus /> <span className="sr-only">Create project</span>
            </SidebarGroupAction>
          </TooltipTrigger>
          <TooltipContent>Create project</TooltipContent>
        </Tooltip>
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

  private SidebarEmptyView() {
    if (!this.empty) return null
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Projects</SidebarGroupLabel>
        <Tooltip delayDuration={400}>
          <TooltipTrigger asChild>
            <SidebarGroupAction title="Create project" onClick={() => this.create()}>
              <Plus /> <span className="sr-only">Create project</span>
            </SidebarGroupAction>
          </TooltipTrigger>
          <TooltipContent>Create project</TooltipContent>
        </Tooltip>
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

  // MARK: Versioner
  // ============================================================================

  static versioner: any = {}
}
