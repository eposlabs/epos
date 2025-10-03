export class Alive extends sw.Unit {
  private startedAt = Date.now()

  constructor(parent: sw.Unit) {
    super(parent)
    this.initBus()
    async: this.initAlarm()
  }

  status() {
    const passed = Date.now() - this.startedAt
    const hours = Math.floor((passed / this.$.utils.time('1h')) % 24)
    const minutes = Math.floor((passed / this.$.utils.time('1m')) % 60)
    const seconds = Math.floor((passed / this.$.utils.time('1s')) % 60)
    const hh = hours.toString().padStart(2, '0')
    const mm = minutes.toString().padStart(2, '0')
    const ss = seconds.toString().padStart(2, '0')
    this.log(`Alive for ${hh}:${mm}:${ss}`)
  }

  private initBus() {
    this.$.bus.on('alive.ping', () => true)
  }

  private async initAlarm() {
    await this.$.browser.alarms.clear('alive.alarm')
    await this.$.browser.alarms.create('alive.alarm', { periodInMinutes: 0.5 })
  }
}
