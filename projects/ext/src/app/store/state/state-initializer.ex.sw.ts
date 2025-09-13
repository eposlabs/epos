export type Origin = null | 'remote'

export class StateInitializer extends $exSw.Unit {
  private $state = this.up($exSw.State)!
  private missedUpdates: Uint8Array[] = []
  private status: null | 'ready' | 'stopped' = null

  async init() {
    if (this.status !== null) return

    await this.$.peer.mutex(`state.setup[${this.$state.id}]`, async () => {
      this.$state.bus.on('update', this.onRemoteUpdate)
      await this.loadStateData()
      this.$state.doc.on('update', this.onDocUpdate)

      this.$state.transaction(() => {
        this.applyMissedUpdates()
        this.applyInitialState()
        this.applyVersioner()
      })

      this.status = 'ready'
    })
  }

  async stop() {
    if (this.status !== 'ready') return
    this.status = 'stopped'
    this.$state.bus.off('update', this.onRemoteUpdate)
    this.$state.doc.off('update', this.onDocUpdate)
    if (this.$.env.is.sw) this.$state.bus.off('swGetDocAsUpdate')
  }

  private onRemoteUpdate = (update: Uint8Array) => {
    if (this.status === 'ready') {
      this.$.libs.yjs.applyUpdate(this.$state.doc, update, 'remote')
    } else if (!this.status) {
      this.missedUpdates.push(update)
    }
  }

  private onDocUpdate = async (update: Uint8Array, origin: Origin) => {
    const isLocalUpdate = origin === null
    if (!isLocalUpdate) return
    await this.$state.bus.send('update', update)
  }

  private async loadStateData() {
    if (this.$.env.is.sw) {
      const data = await this.$.idb.get<Obj>(...this.$state.location)
      this.$state.data = this.$state.doc.transact(() => this.$state.node.create(data ?? {}))
      this.$state.bus.on('swGetDocAsUpdate', () => this.$.libs.yjs.encodeStateAsUpdate(this.$state.doc))
    } else if (this.$.env.is.ex) {
      const update = await this.$state.bus.send<Uint8Array>('swGetDocAsUpdate')
      this.$.libs.yjs.applyUpdate(this.$state.doc, update)
      const yRoot = this.$state.doc.getMap('root')
      this.$state.data = this.$state.node.create(yRoot)
    }
  }

  private applyInitialState() {
    const data = this.$state.data
    if (!data) throw this.never

    const isFreshState = Object.keys(data).length === 0
    if (!isFreshState) return

    this.$state.transaction(() => {
      const initial = this.$state.getInitialState()
      for (const key in initial) this.$state.node.set(data, key, initial[key])
      this.$state.node.set(data, ':version', this.getVersionsDesc().at(-1) ?? 0)
    })
  }

  private applyVersioner() {
    const data = this.$state.data
    if (!data) throw this.never

    const keysBefore = new Set(Object.keys(data))

    for (const version of this.getVersionsDesc()) {
      if (this.$.is.undefined(data[':version'])) throw this.never
      if (data[':version'] >= version) continue
      this.$state.versioner[version].call(data, data)
      data[':version'] = version
    }

    const keysAfter = new Set(Object.keys(data))

    for (const key of keysBefore) {
      if (keysAfter.has(key)) continue
      data[key] = null // Required for MobX to detect change inside 'remove' below
      this.$state.node.remove(data, key)
    }

    for (const key of keysAfter) {
      if (keysBefore.has(key)) continue
      const value = data[key]
      delete data[key] // Required for MobX to detect change inside 'set' below
      this.$state.node.set(data, key, value)
    }
  }

  private applyMissedUpdates() {
    if (this.missedUpdates.length === 0) return
    for (const update of this.missedUpdates) {
      this.$.libs.yjs.applyUpdate(this.$state.doc, update, 'remote')
    }
  }

  private getVersionsDesc() {
    return Object.keys(this.$state.versioner ?? {})
      .map(Number)
      .sort((v1, v2) => v1 - v2)
  }
}
