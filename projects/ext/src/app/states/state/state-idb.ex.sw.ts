export class StateIdb extends $exSw.Unit {
  private $state = this.up($exSw.State)!
  private saving = false
  private pending = false
  private delay = this.$.env.is.dev ? 300 : 2000
  private timeout: number | undefined

  async save() {
    if (!this.$.env.is.sw) return

    // Already saving? -> Mark pending
    if (this.saving) {
      this.pending = true
      return
    }

    // Mark saving
    this.saving = true
    self.clearTimeout(this.timeout)

    // Save to IDB
    const data = this.$state.root!._ // this.$.libs.mobx.toJS(this.$state.root)
    const [_, error] = await this.$.utils.safe(this.$.idb.set(...this.$state.location, data))
    if (error) this.log.error('Failed to save state to IndexedDB', error)

    // Remove saving mark
    this.saving = false

    // Pending? -> Save again
    if (this.pending) {
      this.pending = false
      await this.save()
    }
  }

  saveWithDelay() {
    if (!this.$.env.is.sw) return
    self.clearTimeout(this.timeout)
    this.timeout = self.setTimeout(() => this.save(), this.delay)
  }
}
