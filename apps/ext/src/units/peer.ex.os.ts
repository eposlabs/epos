export class Peer extends exOs.Unit {
  id = this.$.utils.generateId()

  constructor(parent: exOs.Unit) {
    super(parent)
    this.$.bus.on(`Peer.ping[${this.id}]`, () => true)
  }

  async mutex(name: string, fn: () => Promise<void>) {
    await this.$.bus.send('Peer.start', name, this.id)
    const [, error] = await this.$.utils.safe(fn)
    await this.$.bus.send(`Peer.end[${name}][${this.id}]`)
    if (error) throw error
  }
}
