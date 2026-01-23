export class Alive extends os.Unit {
  private sw = this.$.bus.use<sw.Alive>('Alive[sw]')

  constructor(parent: os.Unit) {
    super(parent)
    this.keepBgAlive()
  }

  private keepBgAlive() {
    setInterval(() => this.sw.ping(), this.$.utils.time('20s'))
  }
}
