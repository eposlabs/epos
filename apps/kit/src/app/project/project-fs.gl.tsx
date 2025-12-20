export class ProjectFs extends gl.Unit {
  declare private $project: gl.Project

  init() {
    this.$project = this.closest(gl.Project)!
  }

  async readFile(path: string) {
    const handle = await this.getFileHandle(path)
    return await handle.getFile()
  }

  async readFileAsText(path: string) {
    const file = await this.readFile(path)
    return await file.text()
  }

  async getFileHandle(path: string) {
    const parts = path.split('/')
    const dirs = parts.slice(0, -1)
    const name = parts.at(-1)
    if (!name) throw this.never()

    // Get dir handle
    if (!this.$project.handle) throw this.never()
    let dirHandle = this.$project.handle
    for (const dir of dirs) {
      const [nextDirHandle] = await this.$.utils.safe(dirHandle.getDirectoryHandle(dir))
      if (!nextDirHandle) throw new Error(`File not found: ${path}`)
      dirHandle = nextDirHandle
    }

    // Get file handle
    const [fileHandle] = await this.$.utils.safe(dirHandle.getFileHandle(name))
    if (!fileHandle) throw new Error(`File not found: ${path}`)

    return fileHandle
  }
}
