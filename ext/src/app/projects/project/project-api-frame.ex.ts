export class ProjectApiFrame extends ex.Unit {
  private $project = this.up(ex.Project)!

  async open(url: string, attrs?: Record<string, unknown>): Promise<void>
  async open(name: string, url: string, attrs?: Record<string, unknown>): Promise<void>
  async open(...args: unknown[]) {
    let name: string | null
    let url: string
    let attrs: Record<string, unknown>
    if (this.$.is.string(args[0]) && this.$.is.string(args[1])) {
      name = args[0]
      url = args[1]
      attrs = (args[2] ?? {}) as Record<string, unknown>
    } else {
      name = null
      url = args[0] as string
      attrs = (args[1] ?? {}) as Record<string, unknown>
    }

    name = this.prepareName(name)
    await this.$.bus.send('projects.createProjectFrame', this.$project.name, name, url, attrs)
  }

  async close(name?: string) {
    name = this.prepareName(name)
    await this.$.bus.send('projects.removeProjectFrame', this.$project.name, name)
  }

  async exists(name?: string) {
    name = this.prepareName(name)
    const frames = await this.list()
    return frames.some(frame => (!name && frame.name === null) || frame.name === name)
  }

  async list() {
    const frames = await this.$.bus.send<{ name: string; url: string }[]>(
      'projects.getProjectFrames',
      this.$project.name,
    )

    return frames.map(frame => ({
      name: frame.name === ':default' ? null : frame.name,
      url: frame.url,
    }))
  }

  private prepareName(name: string | null | undefined) {
    if (this.$.is.absent(name)) return ':default'
    if (name === '') throw new Error('Frame name cannot be an empty string')
    if (name.startsWith(':')) throw new Error(`Frame name cannot start with ':'`)
    return name
  }
}
