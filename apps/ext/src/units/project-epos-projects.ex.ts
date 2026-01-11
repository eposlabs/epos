import type { Project, ProjectBundle, ProjectQuery, ProjectSettings } from 'epos'

export class ProjectEposProjects extends ex.Unit {
  private handlers: (() => void)[] = []

  constructor(parent: ex.Unit) {
    super(parent)
    this.$.bus.on('Projects.changed', () => this.handlers.forEach(fn => fn()))
  }

  async create<T extends string>(params: { id?: T } & Partial<ProjectSettings> & ProjectBundle): Promise<T> {
    const id = await this.$.bus.send<sw.Projects['create']>('Projects.create', params)
    if (!id) throw this.never()
    return id as T
  }

  async update(id: string, updates: Partial<ProjectSettings & ProjectBundle>) {
    await this.$.bus.send<sw.Projects['update']>('Projects.update', id, updates)
  }

  async remove(id: string) {
    await this.$.bus.send<sw.Projects['remove']>('Projects.remove', id)
  }

  async has(id: string) {
    const has = await this.$.bus.send<sw.Projects['has']>('Projects.has', id)
    if (!this.$.utils.is.boolean(has)) throw this.never()
    return has
  }

  async get<T extends ProjectQuery>(id: string, query?: T) {
    const project = await this.$.bus.send<sw.Projects['get']>('Projects.get', id, query)
    if (!project) throw this.never()
    return project as Project<T>
  }

  async list<T extends ProjectQuery>(query?: T) {
    const projects = await this.$.bus.send<sw.Projects['getAll']>('Projects.getAll', query)
    if (!projects) throw this.never()
    return projects as Project<T>[]
  }

  watch(handler: () => void) {
    this.handlers.push(handler)
  }

  async fetch(url: Url) {
    const bundle = await this.$.bus.send<sw.Projects['fetch']>('Projects.fetch', url)
    if (!bundle) throw this.never()
    return bundle
  }
}
