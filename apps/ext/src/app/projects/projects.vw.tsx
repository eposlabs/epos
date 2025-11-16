import type { ActionData } from './projects.sw'

export class Projects extends vw.Unit {
  map: { [name: string]: vw.Project } = {}
  hasSidePanel = false
  actionData: ActionData = {}
  selectedProjectName: string | null = localStorage.getItem('projects.selectedProjectName')
  dock = new vw.ProjectsDock(this)
  watcher = new exOsVw.ProjectsWatcher(this)

  list() {
    return Object.values(this.map)
  }

  static async init(parent: vw.Unit) {
    const i = new this(parent)
    await i.init()
    return i
  }

  private async init() {
    await this.initWatcher()
  }

  getSelected() {
    if (!this.selectedProjectName) return null
    return this.map[this.selectedProjectName] ?? null
  }

  select(name: string) {
    if (!this.map[name]) throw this.never
    this.selectedProjectName = name
    this.$.refresh()
    localStorage.setItem('projects.selectedProjectName', name)
  }

  private async initWatcher() {
    await this.watcher.start((delta, data) => {
      // Update projects
      for (const meta of Object.values(data.execution)) {
        const project = this.map[meta.name]
        if (!project) continue
        project.update(meta)
      }

      // Add projects
      for (const name of delta.added) {
        const meta = data.execution[name]
        if (!meta) throw this.never
        this.map[meta.name] = new vw.Project(this, meta)
      }

      // Remove projects
      for (const name of delta.removed) {
        if (!this.map[name]) throw this.never
        delete this.map[name]
      }

      // Update data
      this.hasSidePanel = data.hasSidePanel
      this.actionData = data.action

      // Close view if nothing to show
      const noProjects = this.list().length === 0
      const noActions = Object.keys(this.actionData).length === 0
      if (noProjects && noActions) {
        self.close()
        return
      }

      // Select first project if none selected
      if (!this.selectedProjectName || !this.map[this.selectedProjectName]) {
        this.selectedProjectName = this.list()[0]?.name ?? null
      }

      // Refresh UI
      this.$.refresh()
    })
  }

  ui = () => {
    if (this.list().length === 0) return null
    return (
      <div onMouseEnter={() => this.dock.hide()}>
        {this.list().map(project => (
          <project.ui key={project.name} />
        ))}
      </div>
    )
  }
}
