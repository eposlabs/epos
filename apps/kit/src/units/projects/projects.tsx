export class Projects extends gl.Unit {
  list: gl.Project[] = []
  selectedProjectId: string | null = null

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

  View() {
    const selectedProject = this.selected
    if (!selectedProject) return <div>No project selected</div>
    return (
      <div>
        <selectedProject.View />
      </div>
    )
  }

  static versioner = this.defineVersioner({})
}

// async init() {
//   await this.deleteOrphanedHandles()
// }

// TODO: do not remove, instead "restore" from idb
// /** Delete handles from IDB that do not have corresponding projects. */
// private async deleteOrphanedHandles() {
//   // const idbHandleIds = await this.$.idb.keys('kit', 'handles')
//   // const projectHandleIds = new Set(this.$.projects.list.map(project => project.handleId))
//   // for (const idbHandleId of idbHandleIds) {
//   //   if (projectHandleIds.has(idbHandleId)) continue
//   //   await this.$.idb.delete('kit', 'handles', idbHandleId)
//   // }
// }
