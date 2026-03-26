export class ProjectWatcher extends gl.Unit {
  get $project() {
    return this.closest(gl.Project)!
  }

  get state() {
    return {
      observers: [] as FileSystemObserver[],
    }
  }

  init() {
    this.start()
  }

  dispose() {
    this.stop()
  }

  restart() {
    if (!this.$project.state.handle) return
    this.stop()
    void this.start()
  }

  async start() {
    if (!this.$project.connected) return
    if (this.state.observers.length > 0) return

    let timer = -1
    for (const path of this.$project.paths) {
      const [handle] = await this.$.utils.safe(() => this.$project.getFileHandle(path))
      if (!handle) {
        console.warn('failed', path)
      }
      const observer = new FileSystemObserver(() => {
        clearTimeout(timer)
        timer = setTimeout(() => this.$project.reload())
      })

      observer.observe(handle)
      this.state.observers.push(observer)
    }
  }

  stop() {
    if (this.state.observers.length === 0) return
    for (const observer of this.state.observers) {
      observer.disconnect()
    }
    this.state.observers = []
  }
}
