// TODO: what if mutex fn fails? test
export class Peer extends $sw.Unit {
  id = 'sw'
  private queues = new this.$.utils.QueueMap()

  constructor(parent: $sw.Unit) {
    super(parent)
    this.$.bus.on('peer.start', this.start, this)
  }

  async mutex(name: string, fn: () => Promise<void>) {
    await this.start(name, this.id)
    const [, error] = await this.$.safe(fn)
    await this.$.bus.emit(`peer.end[${name}][${this.id}]`)
    if (error) throw error
  }

  async ping(peerId: string) {
    if (peerId === this.id) return true
    return !!(await this.$.bus.send(`peer.ping[${peerId}]`))
  }

  private async start(name: string, peerId: string) {
    await this.waitThenRun(name, async () => {
      const done$ = Promise.withResolvers<void>()

      // Peer has finished its task? -> Resolve
      this.$.bus.on(`peer.end[${name}][${peerId}]`, () => {
        done$.resolve()
      })

      // Peer has disconnected? -> Resolve
      const pingInterval = self.setInterval(async () => {
        const connected = await this.ping(peerId)
        if (connected) return
        done$.resolve()
      }, 10)

      // Wait till finished or disconnected
      await done$.promise

      // Cleanup
      this.$.bus.off(`peer.end[${name}][${peerId}]`)
      self.clearInterval(pingInterval)
    })
  }

  private async waitThenRun(name: string, fn: () => Promise<void>) {
    const queue = this.queues.ensure(name)
    const promise = queue.checkpoint()
    async: queue.run(fn)
    await promise
  }
}
