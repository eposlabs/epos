export type Origin = null | 'remote'

export class StateSetup extends $exSw.Unit {
  private $state = this.up($exSw.State)!
  private ready = false
  private missedUpdates: Uint8Array[] = []
  private afterReadyFns: Fn[] = []

  async init() {
    await this.$.peer.mutex(`state[${this.$state.id}]`, async () => {
      this.listenForRemoteUpdates()
      await this.initRoot()
      this.broadcastLocalUpdates()
      this.applyMissedUpdates()
      this.upgradeRoot()
      this.callAfterReadyFns()
      this.ready = true
    })
  }

  async cleanup() {
    this.$state.doc.destroy()
    this.$state.bus.off('update')

    if (this.$.env.is.sw) {
      this.$state.bus.off('swGetDoc')
      await this.$state.idb.save()
    }
  }

  whenReady(fn: Fn) {
    if (this.ready) {
      fn()
    } else {
      this.afterReadyFns.push(fn)
    }
  }

  /** Listen for remote updates and apply them to Yjs document */
  private listenForRemoteUpdates() {
    this.$state.bus.on('update', (update: Uint8Array) => {
      if (this.ready) {
        this.$.libs.yjs.applyUpdate(this.$state.doc, update, 'remote')
      } else {
        this.missedUpdates.push(update)
      }
    })
  }

  /** Load state data and populate root */
  private async initRoot() {
    // EX
    if (this.$.env.is.ex) {
      // Apply document from SW
      const update = await this.$state.bus.send<Uint8Array>('swGetDoc')
      this.$.libs.yjs.applyUpdate(this.$state.doc, update)

      // Create MobX state from Yjs document
      const yRoot = this.$state.doc.getMap('root')
      this.$state.root = this.$state.node.create(yRoot)
    }

    // SW
    else if (this.$.env.is.sw) {
      // Read state data from IDB
      const data = await this.$.idb.get<Obj>(...this.$state.location)

      // Create MobX state from IDB data. Yjs document will be filled automatically.
      this.$state.root = this.$state.doc.transact(() => {
        return this.$state.node.create(data ?? {})
      })

      // Serve Yjs document as an update for EX
      this.$state.bus.on('swGetDoc', () =>
        this.$.libs.yjs.encodeStateAsUpdate(this.$state.doc),
      )
    }
  }

  /** Listen for local Yjs updates and broadcast them to other peers */
  private broadcastLocalUpdates() {
    this.$state.doc.on('update', (update: Uint8Array, origin: Origin) => {
      if (origin === null) {
        this.$state.bus.send('update', update)
      }
    })
  }

  /** Set initial state and apply versioner. */
  private upgradeRoot() {
    const root = this.$state.root
    if (!root) throw this.never

    const initial = this.$state.initial
    const versioner = this.$state.versioner
    const versions = Object.keys(versioner ?? {})
      .map(Number)
      .sort((v1, v2) => v1 - v2)

    this.$state.transaction(() => {
      // Fresh state? -> Apply initial state and set the latest version
      if (Object.keys(root).length === 0) {
        if (initial) {
          const data = initial()
          const isObject = Object.getPrototypeOf(data) === Object.prototype
          if (!isObject)
            throw new Error('State must be a regular object', { cause: data })
          if ('@' in data) throw new Error('State must not contain "@" key')
          Object.assign(root, data)
        }

        if (versions.length > 0) {
          root[':version'] = versions.at(-1)
        }
      }

      // Not fresh? -> Apply versioner
      else if (versioner && versions.length > 0) {
        // Start with v0
        root[':version'] ??= 0

        // Upgrade to the latest version
        for (const version of versions) {
          if (root[':version'] >= version) continue
          versioner[version].call(root, root)
          root[':version'] = version
        }
      }
    })
  }

  /** Apply Yjs updates that were received while state was populated */
  private applyMissedUpdates() {
    if (this.missedUpdates.length === 0) return
    this.$state.transaction(() => {
      for (const update of this.missedUpdates) {
        this.$.libs.yjs.applyUpdate(this.$state.doc, update, 'remote')
      }
    })
  }

  private callAfterReadyFns() {
    this.afterReadyFns.forEach(fn => fn())
    this.afterReadyFns = []
  }
}
