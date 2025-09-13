export type Origin = null | 'remote'

export class StateConnector extends $exSw.Unit {
  private $state = this.up($exSw.State)!
  private connected = false
  private missedUpdates: Uint8Array[] = []
  private onConnectedFns: Fn[] = []

  async connect() {
    await this.$.peer.mutex(`state[${this.$state.id}]`, async () => {
      this.listenForRemoteUpdates()
      await this.initRoot()
      this.broadcastLocalUpdates()
      this.applyMissedUpdates()
      this.upgradeRoot()
      this.connected = true
      this.onConnectedFns.forEach(fn => fn())
      this.onConnectedFns = []
    })
  }

  async disconnect() {
    this.$state.doc.destroy()
    this.$state.bus.off('update')

    if (this.$.env.is.sw) {
      this.$state.bus.off('swGetDoc')
      await this.$state.idb.save()
    }
  }

  whenConnected(fn: Fn) {
    if (this.connected) {
      fn()
    } else {
      this.onConnectedFns.push(fn)
    }
  }

  /** Listen for remote updates and apply them to Yjs document. */
  private listenForRemoteUpdates() {
    this.$state.bus.on('update', (update: Uint8Array) => {
      if (this.connected) {
        this.$.libs.yjs.applyUpdate(this.$state.doc, update, 'remote')
      } else {
        this.missedUpdates.push(update)
      }
    })
  }

  /** Load state data and populate root. */
  private async initRoot() {
    // [sw]
    if (this.$.env.is.sw) {
      // Read state data from IDB
      const data = await this.$.idb.get<Obj>(...this.$state.location)

      // Create MobX root state from IDB data. Yjs document will be populated automatically.
      this.$state.root = this.$state.doc.transact(() => this.$state.node.create(data ?? {}))

      // Serve Yjs document
      this.$state.bus.on('swGetDoc', () => this.$.libs.yjs.encodeStateAsUpdate(this.$state.doc))
    }

    // [ex]
    else if (this.$.env.is.ex) {
      // Apply document from [sw]
      const update = await this.$state.bus.send<Uint8Array>('swGetDoc')
      this.$.libs.yjs.applyUpdate(this.$state.doc, update)

      // Create MobX state from Yjs document
      const yRoot = this.$state.doc.getMap('root')
      this.$state.root = this.$state.node.create(yRoot)
    }
  }

  /** Listen for local Yjs updates and broadcast them to other peers. */
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
      // Fresh state?
      if (Object.keys(root).length === 0) {
        // Apply initial state
        if (initial) {
          const data = initial()
          const isRegularObject = Object.getPrototypeOf(data) === Object.prototype
          if (!isRegularObject) throw new Error('State must be a regular js object')
          if ('@' in data) throw new Error(`State must not contain '@' key`)
          Object.assign(root, data)
        }

        // Set the latest version
        if (versions.length > 0) {
          root[':version'] = versions.at(-1)
        }
      }

      // Not fresh state?
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

  /** Apply Yjs updates received while the state was populating. */
  private applyMissedUpdates() {
    if (this.missedUpdates.length === 0) return
    this.$state.transaction(() => {
      for (const update of this.missedUpdates) {
        this.$.libs.yjs.applyUpdate(this.$state.doc, update, 'remote')
      }
    })
  }
}
