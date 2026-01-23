export class Alive extends sw.Unit {
  constructor(parent: sw.Unit) {
    super(parent)
    this.$.bus.register('Alive[sw]', this)
    void this.initAlarm()
  }

  ping() {
    return true
  }

  private async initAlarm() {
    await this.$.browser.alarms.clear('Alive.alarm')
    await this.$.browser.alarms.create('Alive.alarm', { periodInMinutes: 0.5 })
  }
}
