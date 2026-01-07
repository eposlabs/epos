export class Projects extends gl.Unit {
  selectedProjectId: string | null = null

  get state(): { list: gl.Project[] } {
    return { list: [] }
  }

  get static() {
    return { data: { wer: 3 } }
  }

  get map() {
    return Object.fromEntries(this.state.list.map(project => [project.id, project]))
  }

  get selected() {
    return this.state.list.find(project => project.id === this.selectedProjectId) ?? null
  }

  async attach() {
    epos.installer.watch(() => this.updateProjects())
    await this.updateProjects()
  }

  async updateProjects() {
    this.state.list = []
    const projectsData = await epos.installer.list()
    for (const data of projectsData) {
      const project = new gl.Project(this, data.id)
      project.name = data.spec.name
      project.spec = data.spec
      this.state.list.push(project)
    }
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
    this.state.list.push(project)
    this.selectedProjectId = project.id
  }

  static versioner = this.defineVersioner({
    1() {
      Reflect.deleteProperty(this, 'list')
    },
  })
}
