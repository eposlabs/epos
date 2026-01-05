import type { Bundle, Mode } from 'epos'

export class ProjectEposInstaller extends ex.Unit {
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
