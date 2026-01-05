import type { WatcherData } from './projects-watcher.ex.os.vw'

export class Projects extends os.Unit {
  map: { [id: string]: os.Project } = {}
  watcher = new exOsVw.ProjectsWatcher(this, this.onWatcherData.bind(this))

  async init() {
    await this.watcher.init()
  }

  private onWatcherData(data: WatcherData) {
    // Create projects
    for (const projectId of data.addedProjectIds) {
      const info = data.infoMap[projectId]
      if (!info) throw this.never()
      this.map[projectId] = new os.Project(this, info)
    }

    // Remove projects
    for (const projectId of data.removedProjectIds) {
      const project = this.map[projectId]
      if (!project) throw this.never()
      project.dispose()
      delete this.map[projectId]
    }

    // Update retained projects
    for (const projectId of data.retainedProjectIds) {
      const project = this.map[projectId]
      if (!project) throw this.never()
      const info = data.infoMap[projectId]
      if (!info) throw this.never()
      project.update(info)
    }
  }
}
