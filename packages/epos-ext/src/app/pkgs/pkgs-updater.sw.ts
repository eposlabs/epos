export class PkgsUpdater extends $sw.Unit {
  private ws: WebSocket | null = null
  private active = false

  constructor(parent: $sw.Unit) {
    super(parent)
    this.$.bus.on('pkgs.changed', () => this.actualizeConnection())
  }

  start() {
    async: this.actualizeConnection()
  }

  private async actualizeConnection() {
    const hasDevPkgs = this.getDevPkgs().length > 0
    if (hasDevPkgs && !this.active) {
      await this.connect()
    } else if (!hasDevPkgs && this.active) {
      await this.disconnect()
    }
  }

  private async connect() {
    if (this.active) return
    this.active = true

    // Wait for the server to be available
    while (true) {
      const ok = await this.ping()
      if (ok) break
      await this.$.utils.wait(1000)
    }

    // Setup WebSocket connection
    this.ws = new WebSocket(this.$.env.url.ws())

    // Automatically reconnect if server is down
    this.ws.addEventListener('close', async () => {
      if (!this.active) return
      this.active = false
      await this.connect()
    })

    // Reinstall packages on changes
    this.ws.addEventListener('message', async e => {
      const data = JSON.parse(e.data as string) as { name: string }
      if (!this.$.pkgs.map[data.name]) return
      await this.$.pkgs.install(data.name)
    })

    // Show errors in console
    this.ws.addEventListener('error', e => {
      this.log.error('WebSocket error:', e)
    })

    // Reinstall all dev packages on connection
    const pkgs = this.getDevPkgs()
    for (const pkg of pkgs) {
      await this.$.pkgs.install(pkg.name)
    }
  }

  private async disconnect() {
    if (!this.ws) return
    this.active = false
    this.ws.close()
    this.ws = null
  }

  private async ping() {
    const devHubUrl = this.$.env.url.hub(true)
    const [res] = await this.$.safe(() => fetch(devHubUrl))
    return !!res?.ok
  }

  private getDevPkgs() {
    return this.$.pkgs.list.filter(pkg => pkg.dev)
  }
}
