import { IconPlus } from '@tabler/icons-react'
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@ui/components/ui/sidebar'
import type { Project as ProjectData } from 'epos'

export class Projects extends gl.Unit {
  list: gl.Project[] = []
  selectedProjectId: string | null = null

  get selectedProject() {
    return this.list.find(project => project.id === this.selectedProjectId) ?? null
  }

  async attach() {
    const projectsData = await epos.projects.list()
    this.refresh(projectsData)
    epos.projects.watch(projectsData => this.refresh(projectsData))
  }

  private refresh(projectsData: ProjectData[]) {
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

    if (!this.selectedProjectId || !this.list.find(project => project.id === this.selectedProjectId)) {
      this.selectedProjectId = this.list[0]?.id ?? null
    }
  }

  SidebarView() {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Projects</SidebarGroupLabel>
        <SidebarGroupAction title="Add Project">
          <IconPlus /> <span className="sr-only">Add Project</span>
        </SidebarGroupAction>

        <SidebarGroupContent>
          <SidebarMenu>
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
