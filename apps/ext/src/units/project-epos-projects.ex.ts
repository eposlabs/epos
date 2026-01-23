import type { Bundle, Project, ProjectQuery, ProjectSettings } from 'epos'

export class ProjectEposProjects extends ex.Unit {
  private handlers: (() => void)[] = []

  constructor(parent: ex.Unit) {
    super(parent)
    this.$.bus.on('Projects.changed', () => this.handlers.forEach(fn => fn()))
  }

  async get<T extends ProjectQuery>(id: string, query?: T) {
    const project = await this.$.bus.send<sw.Projects['get']>('Projects.get', id, query)
    if (!project) throw this.never()
    return project as Project<T>
  }

  async has(id: string) {
    const has = await this.$.bus.send<sw.Projects['has']>('Projects.has', id)
    if (!this.$.utils.is.boolean(has)) throw this.never()
    return has
  }

  async list<T extends ProjectQuery>(query?: T) {
    const projects = await this.$.bus.send<sw.Projects['all']>('Projects.all', query)
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

  async create<T extends string>(params: Bundle & Partial<{ id: T } & ProjectSettings>): Promise<T> {
    const id = await this.$.bus.send<sw.Projects['create']>('Projects.create', {
      spec: params.spec,
      sources: params.sources,
      assets: params.assets,
      debug: params.debug,
      enabled: params.enabled,
    })
    if (!id) throw this.never()
    return id as T
  }

  async update(id: string, updates: Partial<Bundle & ProjectSettings>) {
    await this.$.bus.send<sw.Projects['update']>('Projects.update', id, {
      spec: updates.spec,
      sources: updates.sources,
      assets: updates.assets,
      debug: updates.debug,
      enabled: updates.enabled,
    })
  }

  async remove(id: string) {
    await this.$.bus.send<sw.Projects['remove']>('Projects.remove', id)
  }

  async export(id: string, debug = false) {
    const files = await this.$.bus.send<sw.Projects['export']>('Projects.export', id, debug)
    if (!files) throw this.never()
    return files
  }
}
