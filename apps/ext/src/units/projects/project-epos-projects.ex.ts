import type { Bundle, Mode, Project } from 'epos'

export type WatchHandler = (projects: Project[]) => void

export class ProjectEposProjects extends ex.Unit {
  private watchHandlers: WatchHandler[] = []

  constructor(parent: ex.Unit) {
    super(parent)
    this.$.bus.on('Projects.changed', this.onProjectsChanged, this)
  }

  async install(id: string, url: Url, mode?: Mode): Promise<void>
  async install(id: string, bundle: Bundle): Promise<void>
  async install(idArg: string, inputArg: Url | Bundle, modeArg: Mode = 'production'): Promise<void> {
    if (this.$.utils.is.object(inputArg)) {
      const id = this.prepareId(idArg)
      const bundle = this.prepareBundle(inputArg)
      await this.$.bus.send<sw.Projects['install']>('Projects.install', id, bundle)
    } else {
      const id = this.prepareId(idArg)
      const url = this.prepareUrl(inputArg)
      const mode = this.prepareMode(modeArg)
      await this.$.bus.send<sw.Projects['install']>('Projects.install', id, url, mode)
    }
  }

  async remove(idArg: string) {
    const id = this.prepareId(idArg)
    await this.$.bus.send<sw.Projects['remove']>('Projects.remove', id)
  }

  async enable(idArg: string) {
    const id = this.prepareId(idArg)
    await this.$.bus.send<sw.Projects['enable']>('Projects.enable', id)
  }

  async disable(idArg: string) {
    const id = this.prepareId(idArg)
    await this.$.bus.send<sw.Projects['disable']>('Projects.disable', id)
  }

  watch(handler: WatchHandler) {
    this.watchHandlers.push(handler)
  }

  async list(): Promise<Project[]> {
    const infoMap = await this.$.bus.send<sw.Projects['getInfoMap']>('Projects.getInfoMap')
    if (!infoMap) throw this.never()

    return Object.values(infoMap).map(info => ({
      id: info.id,
      mode: info.mode,
      spec: info.spec,
      enabled: info.enabled,
    }))
  }

  private async onProjectsChanged() {
    const projects = await this.list()
    this.watchHandlers.forEach(handler => handler(projects))
  }

  private prepareBundle(bundle: Obj): Bundle {
    return bundle as Bundle
  }

  private prepareUrl(url: unknown): string {
    if (!this.$.utils.is.string(url)) throw new Error('URL must be a string')
    if (!URL.canParse(url)) throw new Error(`Invalid URL: '${url}'`)
    return url
  }

  private prepareMode(mode: unknown): Mode {
    if (mode === 'production' || mode === 'development') return mode
    throw new Error(`Invalid mode: '${mode}'. Expected 'production' or 'development'.`)
  }

  private prepareId(id: unknown): string {
    if (!this.$.utils.is.string(id)) throw new Error('Project id must be a string')
    return id
  }
}
