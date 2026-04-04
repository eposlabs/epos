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
    this.stop()
  }

  stop() {
    this.stopFileObservers()
    this.stopGlobalObserver()
  }

  async startGlobalObserver() {
    if (this.state.globalObserver) return
    const handle = this.$project.state.handle
    if (!handle) throw this.never()

    const observer = new FileSystemObserver(records => {
      // Error? -> Reload
      if (this.$project.state.error) {
        this.scheduleReload()
        return
      }

      // epos.json changed? -> Reload
      for (const record of records) {
        const path = record.relativePathComponents.join('/')
        const pathMovedFrom = record.relativePathMovedFrom?.join('/') ?? null
        if (path === 'epos.json' || pathMovedFrom === 'epos.json') {
          this.scheduleReload()
        }
      }
    })

    const [, error] = await this.$.utils.safe(() => observer.observe(handle, { recursive: true }))
    if (error) return this.log.error(error)
    this.state.globalObserver = observer
  }

  stopGlobalObserver() {
    if (!this.state.globalObserver) return
    this.state.globalObserver.disconnect()
    this.state.globalObserver = null
  }

  async startFileObserver(path: string) {
    const handle = await this.$project.getFileHandle(path)
    const observer = new FileSystemObserver(() => this.scheduleReload())
    await observer.observe(handle)
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
}
