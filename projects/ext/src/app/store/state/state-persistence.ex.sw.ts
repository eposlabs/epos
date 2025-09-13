export class StatePersistence extends $exSw.Unit {
  private $state = this.up($exSw.State)!
  private saving = false
  private pending = false
  private delay = this.$.env.is.dev ? 300 : 2000
  private timeout: number | undefined

  async save(immediately = false) {
    if (!this.$.env.is.sw) return

    if (immediately) {
      await this.saveImmediately()
    } else {
      self.clearTimeout(this.timeout)
      this.timeout = self.setTimeout(() => this.saveImmediately(), this.delay)
    }
  }

  private async saveImmediately() {
    // Already saving? -> Mark pending
    if (this.saving) {
      this.pending = true
      return
    }

    // Mark saving
    this.saving = true
    self.clearTimeout(this.timeout)

    // Save to IDB
    const data = this.$state.node.unwrap(this.$state.data)
    const [_, error] = await this.$.utils.safe(this.$.idb.set(...this.$state.location, data))
    if (error) this.log.error('Failed to save state to IndexedDB', error)

    // Remove saving mark
    this.saving = false

    // Pending? -> Save again
    if (this.pending) {
      this.pending = false
      await this.saveImmediately()
    }
  }
}
