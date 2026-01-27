export class Projects extends gl.Unit {
  dict: { [projectId: string]: gl.Project } = {}
  selectedProjectId: string | null = null
  ui = new gl.ProjectsUi(this)
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

  View() {
    return <this.ui.View />
  }

  SidebarView() {
    return <this.ui.SidebarView />
  }

  static versioner: any = {
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
    6() {
      this.ui = new gl.ProjectsUi(this)
    },
    7() {
      this.ui = new gl.ProjectsUi(this)
      this.actions = {}
    },
    8() {
      this.ui = new gl.ProjectsUi(this)
      delete this.actions
    },
  }
}
