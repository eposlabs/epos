export class ProjectApiFrame extends ex.Unit {
  private $project = this.up(ex.Project)!

  async open(name: string, url: string, attrs: Record<string, unknown> = {}) {
    await this.$.bus.send<number>('projects.createProjectFrame', this.$project.name, name, url, attrs)
  }

  async close(name: string) {
    await this.$.bus.send('projects.removeProjectFrame', this.$project.name, name)
  }

  async exists(name: string) {
    const frames = await this.list()
    return frames.some(frame => frame.name === name)
  }

  async list() {
    return await this.$.bus.send<{ name: string; url: string }[]>(
      'projects.getProjectFrames',
      this.$project.name,
    )
  }
}
