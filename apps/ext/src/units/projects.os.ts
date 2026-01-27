import type { WatcherData } from './projects-watcher.ex.os.vw'

export class Projects extends os.Unit {
  dict: { [id: string]: os.Project } = {}
  watcher = new exOsVw.ProjectsWatcher(this, this.onWatcherData.bind(this))
  sw = this.$.bus.use<sw.Projects>('Projects[sw]')
  bus = this.$.bus.for('Projects')

  async init() {
    await this.watcher.init()
  }

  private onWatcherData(data: WatcherData) {
    // Create projects
    for (const projectId of data.addedProjectIds) {
      const entry = data.entries[projectId]
      if (!entry) throw this.never()
      this.dict[projectId] = new os.Project(this, entry)
    }

    // Remove projects
    for (const projectId of data.removedProjectIds) {
      const project = this.dict[projectId]
      if (!project) throw this.never()
      project.dispose()
      delete this.dict[projectId]
    }

    // Update retained projects
    for (const projectId of data.retainedProjectIds) {
      const project = this.dict[projectId]
      if (!project) throw this.never()
      const entry = data.entries[projectId]
      if (!entry) throw this.never()
      project.update(entry)
    }
  }
}
