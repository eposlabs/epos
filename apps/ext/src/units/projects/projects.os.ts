import type { WatcherData } from './projects-watcher.ex.os.vw'

export class Projects extends os.Unit {
  map: { [name: string]: os.Project } = {}
  watcher = new exOsVw.ProjectsWatcher(this, this.onWatcherData.bind(this))

  async init() {
    await this.watcher.init()
  }

  private onWatcherData(data: WatcherData) {
    // Create projects
    for (const projectName of data.addedProjectNames) {
      const info = data.infoMap[projectName]
      if (!info) throw this.never()
      this.map[projectName] = new os.Project(this, info)
    }

    // Remove projects
    for (const projectName of data.removedProjectNames) {
      const project = this.map[projectName]
      if (!project) throw this.never()
      project.dispose()
      delete this.map[projectName]
    }

    // Update retained projects
    for (const projectName of data.retainedProjectNames) {
      const project = this.map[projectName]
      if (!project) throw this.never()
      const info = data.infoMap[projectName]
      if (!info) throw this.never()
      project.update(info)
    }
  }
}
