import { Button } from '@/components/ui/button.js'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty.js'
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu } from '@/components/ui/sidebar.js'
import { FolderCode, Plus } from 'lucide-react'

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
    if (this.list.length === 0) return <this.WelcomeView />
    if (!this.selected) return null
    return <this.selected.View />
  }

  SidebarView() {
    if (this.list.length === 0) return null
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Projects</SidebarGroupLabel>
        <SidebarGroupContent className="flex flex-col gap-3">
          <SidebarMenu className="gap-1">
            {this.list.map(project => (
              <project.SidebarView key={project.id} />
            ))}
          </SidebarMenu>
          <Button size="sm" variant="outline" onClick={() => this.create()}>
            <Plus className="mr-2 -ml-3" />
            Add Project
          </Button>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  private WelcomeView() {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-lg">Welcome</div>
          <Button onClick={() => this.create()}>Create Project</Button>
        </div>
      </div>
    )

    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderCode />
          </EmptyMedia>
          <EmptyTitle>No Projects Yet</EmptyTitle>
          <EmptyDescription>
            You haven&apos;t created any projects yet. Get started by creating your first project.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-2">
          <Button onClick={() => this.create()}>Create Project</Button>
        </EmptyContent>
      </Empty>
    )
  }

  // MARK: Versioner
  // ============================================================================

  static versioner: any = {}
}
