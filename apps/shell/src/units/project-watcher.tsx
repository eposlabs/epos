export class ProjectWatcher extends gl.Unit {
  get $project() {
    return this.closest(gl.Project)!
  }

  get state() {
    return {
      globalObserver: null as FileSystemObserver | null,
      fileObservers: [] as FileSystemObserver[],
      reloadTimer: -1,
    }
  }

  dispose() {
    this.stopFileObservers()
    this.stopGlobalObserver()
  }

  startGlobalObserver() {
    if (this.state.globalObserver) return
    if (!this.$project.state.handle) throw this.never()

    this.state.globalObserver = new FileSystemObserver(records => {
      // Error? -> Reload
      if (this.$project.state.error) {
        this.scheduleReload()
        return
      }

      // epos.json changed? -> Reload
      for (const record of records) {
        const path = record.relativePathComponents.join('/')
        if (path === 'epos.json') {
          this.scheduleReload()
        }
      }
    })

    this.state.globalObserver.observe(this.$project.state.handle, { recursive: true })
  }

  stopGlobalObserver() {
    if (!this.state.globalObserver) return
    this.state.globalObserver.disconnect()
    this.state.globalObserver = null
  }

  async startFileObserver(path: string, file: File) {
    const hash = await this.getFileHash(file)
    const [handle] = await this.$.utils.safe(() => this.$project.getFileHandle(path))
    if (!handle) throw this.never()

    const observer = new FileSystemObserver(async () => {
      const [file2] = await this.$.utils.safe(() => handle.getFile())
      if (!file2) return this.scheduleReload()
      const hash2 = await this.getFileHash(file2)
      if (hash !== hash2) return this.scheduleReload()
    })

    observer.observe(handle)
    this.state.fileObservers.push(observer)
  }

  stopFileObservers() {
    this.state.fileObservers.forEach(observer => observer.disconnect())
    this.state.fileObservers = []
  }

  private scheduleReload() {
    clearTimeout(this.state.reloadTimer)
    this.state.reloadTimer = this.setTimeout(() => this.$project.reload())
  }

  private async getFileHash(file: File) {
    const fileBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer)
    const hashHex = [...new Uint8Array(hashBuffer)].map(byte => byte.toString(16).padStart(2, '0')).join('')
    return hashHex
  }
}
