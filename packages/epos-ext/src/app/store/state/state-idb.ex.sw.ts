export class StateIdb extends $exSw.Unit {
  private $state = this.up($exSw.State, 'internal')!
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
    try {
      const data = this.$.libs.mobx.toJS(this.$state.root)
      await this.$.idb.set(...this.$state.location, data)
    } catch (e) {
      this.log.error('Failed to save state to IndexedDB', e)
    }

    // Remove saving mark
    this.saving = false

    // Pending? -> Save again
    if (this.pending) {
      this.pending = false
      async: this.save()
    }
  }

  saveWithDelay() {
    if (!this.$.env.is.sw) return
    self.clearTimeout(this.timeout)
    this.timeout = self.setTimeout(() => this.save(), this.delay)
  }
}
