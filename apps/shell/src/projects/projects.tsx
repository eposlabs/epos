import { Button } from '@/components/ui/button.js'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty.js'
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar.js'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.js'
import { FolderCode, Plus } from 'lucide-react'

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

  // MARK: Main
  // ============================================================================

  async attach() {
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

  // MARK: Helpers
  // ============================================================================

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
      <SidebarGroup>
        {/* Empty */}
        {this.empty && (
          <Empty className="justify-start">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderCode />
              </EmptyMedia>
              <EmptyTitle>No Projects Yet</EmptyTitle>
              <EmptyDescription>
                You haven't created any projects yet. Get started by creating your first project.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
              <Button onClick={() => this.create()}>Create Project</Button>
            </EmptyContent>
          </Empty>
        )}

        {/* Non-empty */}
        {!this.empty && (
          <>
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
          </>
        )}
      </SidebarGroup>
    )
  }

  // MARK: Versioner
  // ============================================================================

  static versioner: any = {
    1(this: any) {
      this.list = []
    },
    2() {
      this.selectedId = null
    },
    4(this: any) {
      delete this.list
      this.dict = {}
    },
    5() {
      this.creation = new gl.ProjectsCreation(this)
    },
    6() {
      this.ui = {}
    },
    7() {
      this.ui = {}
      this.actions = {}
    },
    8() {
      this.ui = {}
      delete this.actions
    },
    9() {
      delete this.ui
    },
    10() {
      delete this.creation
    },
  }
}
