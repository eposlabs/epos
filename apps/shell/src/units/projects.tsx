import { Button } from '@/components/ui/button.js'
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu } from '@/components/ui/sidebar.js'
import { Plus } from 'lucide-react'

export class Projects extends gl.Unit {
  dict: { [projectId: string]: gl.Project } = {}
  selectedId: string | null = null

  get list() {
    return Object.values(this.dict)
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
    const eposProjects = await epos.projects.list({ sources: true })

    // Update existing projects and add new ones
    for (const eposProject of eposProjects) {
      if (eposProject.id === epos.env.project.id) continue
      const project = this.dict[eposProject.id]
      if (project) {
        project.update(eposProject)
      } else {
        this.dict[eposProject.id] = new gl.Project(this, eposProject)
      }
    }

    // Remove deleted projects
    for (const projectId in this.dict) {
      const exists = eposProjects.find(eposProject => eposProject.id === projectId)
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
      <SidebarGroup>
        <SidebarGroupLabel>Projects</SidebarGroupLabel>
        <SidebarGroupContent className="flex flex-col gap-3">
          {this.list.length > 0 && (
            <SidebarMenu className="gap-1">
              {this.list.map(project => (
                <project.SidebarView key={project.id} />
              ))}
            </SidebarMenu>
          )}
          <div className="first:mt-1">
            <Button size="sm" variant="outline" onClick={() => this.create()} className="w-full">
              <Plus className="mr-2 -ml-3" />
              Add Project
            </Button>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  // MARK: Versioner
  // ============================================================================

  static versioner: any = {}
}
