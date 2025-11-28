import type { Props } from './project/project.ex'

export class Projects extends ex.Unit {
  map: { [name: string]: ex.Project } = {}
  injector = new ex.ProjectsInjector(this)
  watcher = new exOsVw.ProjectsWatcher(this)

  async init() {
    this.initWatcher()
    await this.injector.init()
  }

  async create(props: Props) {
    const project = new ex.Project(this, props)
    await project.init()
    this.map[props.name] = project
    return project
  }

  private initWatcher() {
    this.watcher.start(delta => {
      if (delta.updated.length > 0 && new URLSearchParams(location.search).has('autoreload')) {
        location.reload()
      }
    })
  }
}
