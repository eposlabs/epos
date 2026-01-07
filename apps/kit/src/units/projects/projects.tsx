import { IconPlus } from '@tabler/icons-react'
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@ui/components/ui/sidebar'

export class Projects extends gl.Unit {
  list: gl.Project[] = []
  selectedProjectId: string | null = null

  async attach() {
    await this.update()
    epos.projects.watch(this.update)
  }

  private async update() {
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
      if (exists) return
      this.list.remove(project)
    })
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

  static versioner = this.defineVersioner({
    1() {
      this.list = []
    },
    2() {
      this.selectedProjectId = null
    },
  })
}
