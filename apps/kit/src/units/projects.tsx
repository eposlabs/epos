import { IconPlus } from '@tabler/icons-react'
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@ui/components/ui/sidebar'

// TODO: add projects.orderIds for sorting
export class Projects extends gl.Unit {
  list: gl.Project[] = []
  selectedProjectId: string | null = null

  get selectedProject() {
    return this.list.find(project => project.id === this.selectedProjectId) ?? null
  }

  async attach() {
    epos.projects.watch(() => this.refreshProjects())
    await this.refreshProjects()
  }

  async createEmptyProject() {
    let name = 'New Project'
    let index = 1
    while (this.list.find(project => project.spec.name === name)) {
      index += 1
      name = `New Project ${index}`
    }

    this.selectedProjectId = await epos.projects.create({
      spec: this.$.libs.parseSpecObject({ name }),
      sources: {},
      assets: {},
      mode: 'development',
      enabled: true,
    })
  }

  private async refreshProjects() {
    // Fetch projects from epos
    let projectsData = await epos.projects.list()

    // Exclude `kit` project
    projectsData = projectsData.filter(projectData => projectData.spec.slug !== 'kit')

    // Update existing projects and add new ones
    projectsData.forEach(projectData => {
      const project = this.list.find(project => project.id === projectData.id)
      if (project) {
        project.update(projectData)
      } else {
        this.list.push(new gl.Project(this, projectData))
      }
    })

    // Remove deleted projects
    this.list.forEach(project => {
      const exists = projectsData.find(projectData => projectData.id === project.id)
      if (!exists) this.list.remove(project)
    })

    // Deselect project if it was removed
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

  static versioner = this.defineVersioner({
    1() {
      this.list = []
    },
    2() {
      this.selectedProjectId = null
    },
  })
}
