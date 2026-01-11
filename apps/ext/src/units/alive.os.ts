export class Alive extends os.Unit {
  constructor(parent: os.Unit) {
    super(parent)
    this.keepBgAlive()
  }

  private keepBgAlive() {
    self.setInterval(() => this.$.bus.send('Alive.ping'), this.$.utils.time('20s'))
  }
}
