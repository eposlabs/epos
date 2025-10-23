export class ProjectFs extends gl.Unit {
  declare private $project: gl.Project
  declare private observer: FileSystemObserver | null

  init() {
    this.$project = this.up(gl.Project)!
    this.observer = null
  }

  cleanup() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }

  startObserver() {
    this.observer = new FileSystemObserver(records => {
      if (this.$project.state.error) {
        this.$project.updateWithDelay()
        return
      }

      for (const record of records) {
        const path = record.relativePathComponents.join('/')
        if (this.$project.usesPath(path)) {
          this.$project.updateWithDelay()
          return
        }
      }
    })

    this.observer.observe(this.handle, { recursive: true })
  }

  /** Root project dir handle. */
  private get handle() {
    if (!this.$project.handle) throw this.never('Accessing project handle before initialization')
    return this.$project.handle
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
    let dirHandle: FileSystemDirectoryHandle = this.handle
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
