import type { Props } from './project/project.ex'

export class Projects extends ex.Unit {
  map: { [name: string]: ex.Project } = {}
  watcher = new exOsVw.ProjectsWatcher(this)

  async create(props: Props) {
    const project = new ex.Project(this, props)
    await project.init()
    this.map[props.name] = project
    return project
  }

  constructor(parent: ex.Unit) {
    super(parent)

    this.watcher.start(delta => {
      if (delta.updated.length > 0 && new URLSearchParams(location.search).has('autoreload')) {
        location.reload()
      }
    })
  }
}
