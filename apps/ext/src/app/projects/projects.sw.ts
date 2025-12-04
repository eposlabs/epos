import type { ActionMeta, Bundle, ExecutionMeta } from './project/project.sw'

export type ActionData = { [name: string]: ActionMeta }
export type ExecutionData = { [name: string]: ExecutionMeta }

export class Projects extends sw.Unit {
  map: { [name: string]: sw.Project } = {}
  action = new sw.ProjectsAction(this)
  injector = new sw.ProjectsInjector(this)
  installer = new sw.ProjectsInstaller(this)
  loader = new sw.ProjectsLoader(this)

  get list() {
    return Object.values(this.map)
  }

  async init() {
    this.$.bus.on('Projects.hasPopup', this.hasPopup, this)
    this.$.bus.on('Projects.hasSidePanel', this.hasSidePanel, this)
    this.$.bus.on('Projects.getCss', this.getCss, this)
    this.$.bus.on('Projects.getLiteJs', this.getLiteJs, this)
    this.$.bus.on('Projects.getPayloads', this.getPayloads, this)
    this.$.bus.on('Projects.getActionData', this.getActionData, this)
    this.$.bus.on('Projects.getExecutionData', this.getExecutionData, this)
    this.$.bus.on('Projects.export', this.exportProject, this)
    await this.restoreFromIdb()
    await this.loader.init()
    await this.injector.init()
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
      const project = new sw.Project(this, bundle.spec.name)
      await project.init(bundle)
      this.map[bundle.spec.name] = project
    }
  }

  hasPopup() {
    return this.list.some(project => project.targets.some(target => target.matches.includes('<popup>')))
  }

  hasSidePanel() {
    return this.list.some(project => project.targets.some(target => target.matches.includes('<sidePanel>')))
  }

  getCss(url: string, frame = false) {
    return this.list
      .map(project => project.getCss(url, frame))
      .filter(this.$.utils.is.present)
      .join('\n')
      .trim()
  }

  getLiteJs(url: string, frame = false) {
    return this.list
      .map(project => project.getLiteJs(url, frame))
      .filter(this.$.utils.is.present)
      .join('\n')
      .trim()
  }

  getPayloads(url: string, frame = false) {
    return this.list.map(project => project.getPayload(url, frame)).filter(this.$.utils.is.present)
  }

  getActionData() {
    const data: ActionData = {}
    for (const project of this.list) {
      const meta = project.getActionMeta()
      if (!meta) continue
      data[project.name] = meta
    }

    return data
  }

  private async getExecutionData(url: string, frame = false) {
    const data: ExecutionData = {}
    for (const project of this.list) {
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
