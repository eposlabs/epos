import type { Bundle, Mode } from 'epos'
import type { Spec } from 'epos-spec'

export type Project = { id: string; mode: Mode; spec: Spec }
export type WatchHandler = (projects: Project[]) => void

export class ProjectEposInstaller extends ex.Unit {
  private watchHandlers: WatchHandler[] = []

  constructor(parent: ex.Unit) {
    super(parent)
    this.$.bus.on('Projects.changed', this.onProjectsChanged, this)
  }

  async install(id: string, url: Url, mode?: Mode): Promise<void>
  async install(id: string, bundle: Bundle): Promise<void>
  async install(id: string, inputArg: Url | Bundle, modeArg: Mode = 'production'): Promise<void> {
    if (this.$.utils.is.object(inputArg)) {
      const bundle = this.prepareBundle(inputArg)
      await this.$.bus.send<sw.Projects['install']>('Projects.install', id, bundle)
    } else {
      const url = this.prepareUrl(inputArg)
      const mode = this.prepareMode(modeArg)
      await this.$.bus.send<sw.Projects['install']>('Projects.install', id, url, mode)
    }
  }

  async remove(nameArg: string) {
    const name = this.prepareName(nameArg)
    await this.$.bus.send<sw.Projects['remove']>('Projects.remove', name)
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
    }))
  }

  private async onProjectsChanged() {
    const projects = await this.list()
    this.watchHandlers.forEach(handler => handler(projects))
  }

  private prepareBundle(bundle: Obj): Bundle {
    return bundle as Bundle
  }

  private prepareUrl(url: unknown) {
    if (!this.$.utils.is.string(url)) throw new Error('URL must be a string')
    if (!URL.canParse(url)) throw new Error(`Invalid URL: '${url}'`)
    return url
  }

  private prepareMode(mode: unknown): Mode {
    if (mode === 'production' || mode === 'development') return mode
    throw new Error(`Invalid mode: '${mode}'. Expected 'production' or 'development'.`)
  }

  private prepareName(name: unknown): string {
    if (!this.$.utils.is.string(name)) throw new Error('Project name must be a string')
    return name
  }
}
