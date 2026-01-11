import { IconPlus } from '@tabler/icons-react'
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@ui/components/ui/sidebar'
import { parseSpecObject } from 'epos-spec'

// TODO: add projects.orderIds for sorting
export class Projects extends gl.Unit {
  list: gl.Project[] = []
  selectedProjectId: string | null = null

  get selectedProject() {
    return this.list.find(project => project.id === this.selectedProjectId) ?? null
  }

  async attach() {
    await this.refresh()
    epos.projects.watch(() => this.refresh())
  }

  async createEmptyProject() {
    const projectId = await epos.projects.create({
      spec: parseSpecObject({ name: 'New Project' }),
      enabled: true,
      sources: {},
      assets: {},
    })

    this.selectedProjectId = projectId
  }

  private async refresh() {
    const projectsData = await epos.projects.list()

    projectsData.forEach(projectData => {
      const project = this.list.find(project => project.id === projectData.id)
      if (project) {
        project.update(projectData)
      } else {
        this.list.push(new gl.Project(this, projectData))
      }
    })

    this.list.forEach(project => {
      const exists = projectsData.find(projectData => projectData.id === project.id)
      if (!exists) this.list.remove(project)
    })

    if (!this.list.find(project => project.id === this.selectedProjectId)) {
      this.selectedProjectId = null
    }
  }

  SidebarView() {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Projects</SidebarGroupLabel>
        <SidebarGroupAction title="Add Project" onClick={() => this.createEmptyProject()}>
          <IconPlus /> <span className="sr-only">Add Project</span>
        </SidebarGroupAction>
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

  SelectedProjectView() {
    if (!this.selectedProject) return null
    return <this.selectedProject.View />
  }

  get versioner() {
    return {
      1: () => (this.list = []),
      2: () => (this.selectedProjectId = null),
    }
  }
}
