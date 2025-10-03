export class Peer extends exOs.Unit {
  id = this.$.utils.id()

  constructor(parent: exOs.Unit) {
    super(parent)
    this.$.bus.on(`peer.ping[${this.id}]`, () => true)
  }

  async mutex(name: string, fn: () => Promise<void>) {
    await this.$.bus.send('peer.start', name, this.id)
    const [, error] = await this.$.utils.safe(fn)
    await this.$.bus.send(`peer.end[${name}][${this.id}]`)
    if (error) throw error
  }
}
