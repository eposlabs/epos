export class Projects extends gl.Unit {
  list: gl.Project[] = []
  selectedProjectId: string | null = null

  async attach() {
    epos.installer.watch(() => this.updateProjects())
    await this.updateProjects()
  }

  async updateProjects() {
    console.warn('update')
    this.list = []
    const projectsData = await epos.installer.list()
    for (const data of projectsData) {
      const project = new gl.Project(this, data.id)
      project.name = data.spec.name
      project.spec = data.spec
      this.list.push(project)
    }
  }

  get map() {
    return Object.fromEntries(this.list.map(project => [project.id, project]))
  }

  get selected() {
    return this.list.find(project => project.id === this.selectedProjectId) ?? null
  }

  async add() {
    // Ask user for a directory handle
    const [handle] = await this.$.utils.safe(() => self.showDirectoryPicker({ mode: 'read' }))
    if (!handle) return

    // Save the handle to IDB
    const handleId = this.$.libs.nanoid()
    await this.$.idb.set('kit', 'handles', handleId, handle)

    // Create new project and select it
    const project = new gl.Project(this, handleId)
    this.list.push(project)
    this.selectedProjectId = project.id
  }
}
