import type { ActionMeta, Bundle, ExecutionMeta } from './project/project.sw'

export type ActionData = { [name: string]: ActionMeta }
export type ExecutionData = { [name: string]: ExecutionMeta }

export class Projects extends sw.Unit {
  map: { [name: string]: sw.Project } = {}
  installer = new sw.ProjectsInstaller(this)
  loader!: sw.ProjectsLoader

  list() {
    return Object.values(this.map)
  }

  static async create(parent: sw.Unit) {
    const projects = new Projects(parent)
    await projects.init()
    return projects
  }

  private async init() {
    this.$.bus.on('projects.hasPopup', this.hasPopup, this)
    this.$.bus.on('projects.hasSidePanel', this.hasSidePanel, this)
    this.$.bus.on('projects.getCss', this.getCss, this)
    this.$.bus.on('projects.getLiteJs', this.getLiteJs, this)
    this.$.bus.on('projects.getPayloads', this.getPayloads, this)
    this.$.bus.on('projects.getActionData', this.getActionData, this)
    this.$.bus.on('projects.getExecutionData', this.getExecutionData, this)
    this.$.bus.on('projects.export', this.exportProject, this)
    await this.restoreFromIdb()
    this.loader = await sw.ProjectsLoader.create(this)
  }

  private async exportProject(projectName: string, dev = false) {
    const project = this.map[projectName]
    if (!project) throw new Error(`No such project: ${projectName}`)
    return await project.exporter.export(dev)
  }

  async createOrUpdate(bundle: Bundle) {
    if (this.map[bundle.spec.name]) {
      const project = this.map[bundle.spec.name]
      await project.update(bundle)
    } else {
      const project = await sw.Project.create(this, bundle)
      this.map[bundle.spec.name] = project
    }
  }

  hasPopup() {
    return this.list().some(project => project.targets.some(target => target.matches.includes('<popup>')))
  }

  hasSidePanel() {
    return this.list().some(project => project.targets.some(target => target.matches.includes('<sidePanel>')))
  }

  getCss(url: string, frame = false) {
    return this.list()
      .map(project => project.getCss(url, frame))
      .filter(this.$.is.present)
      .join('\n')
      .trim()
  }

  getLiteJs(url: string, frame = false) {
    return this.list()
      .map(project => project.getLiteJs(url, frame))
      .filter(this.$.is.present)
      .join('\n')
      .trim()
  }

  getPayloads(url: string, frame = false) {
    return this.list()
      .map(project => project.getPayload(url, frame))
      .filter(this.$.is.present)
  }

  getActionData() {
    const data: ActionData = {}
    for (const project of this.list()) {
      const meta = project.getActionMeta()
      if (!meta) continue
      data[project.name] = meta
    }

    return data
  }

  private async getExecutionData(url: string, frame = false) {
    const data: ExecutionData = {}
    for (const project of this.list()) {
      const meta = await project.getExecutionMeta(url, frame)
      if (!meta) continue
      data[project.name] = meta
    }

    return data
  }

  private async restoreFromIdb() {
    const names = await this.$.idb.listDatabases()
    for (const name of names) {
      const project = await sw.Project.restore(this, name)
      if (!project) continue
      this.map[name] = project
    }
  }
}
