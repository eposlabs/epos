import type { Bundle, Project, ProjectQuery, ProjectSettings } from 'epos'

export class ProjectEposProjects extends ex.Unit {
  private $projects = this.closest(ex.Projects)!
  private changeHandlers: (() => void)[] = []

  constructor(parent: ex.Unit) {
    super(parent)
    this.$projects.bus.on('changes', () => this.changeHandlers.forEach(fn => fn()))
  }

  async get<T extends ProjectQuery>(id: string, query?: T) {
    const project = await this.$projects.sw.get(id, query)
    if (!project) throw this.never()
    return project as Project<T>
  }

  async has(id: string) {
    const has = await this.$projects.sw.has(id)
    if (!this.$.utils.is.boolean(has)) throw this.never()
    return has
  }

  async list<T extends ProjectQuery>(query?: T) {
    const projects = await this.$projects.sw.all(query)
    if (!projects) throw this.never()
    return projects as Project<T>[]
  }

  watch(handler: () => void) {
    this.changeHandlers.push(handler)
  }

  async fetch(url: Url) {
    const bundle = await this.$projects.sw.fetch(url)
    if (!bundle) throw this.never()
    return bundle
  }

  async create<T extends string>(params: Bundle & Partial<{ id: T } & ProjectSettings>): Promise<T> {
    const id = await this.$projects.sw.create({
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
    await this.$projects.sw.update(id, {
      spec: updates.spec,
      sources: updates.sources,
      assets: updates.assets,
      debug: updates.debug,
      enabled: updates.enabled,
    })
  }

  async remove(id: string) {
    await this.$projects.sw.remove(id)
  }

  async export(id: string) {
    const files = await this.$projects.sw.export(id)
    if (!files) throw this.never()
    return files
  }
}
