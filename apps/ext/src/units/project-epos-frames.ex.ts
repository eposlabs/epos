import type { Attrs, Frame } from './project.os'

export class ProjectEposFrames extends ex.Unit {
  private $project = this.closest(ex.Project)!

  async create(url: Url, attrs: Attrs = {}): Promise<string> {
    const id = await this.$project.os.createFrame(url, attrs)
    if (!id) throw this.never()
    return id
  }

  async remove(id: string): Promise<void> {
    await this.$project.os.removeFrame(id)
  }

  async has(id: string): Promise<boolean> {
    const frames = await this.list()
    return frames.some(frame => frame.id === id)
  }

  async list(): Promise<Frame[]> {
    const frames = await this.$project.os.getFrames()
    if (!frames) throw this.never()
    return frames
  }
}
