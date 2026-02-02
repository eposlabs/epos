export class App extends gl.App<bg> {
  get fg() {
    return this.use<fg.App>('fg')
  }

  attach() {
    this.expose('bg')
  }

  async spawn() {
    this.log('SPAWN')
    await this.fg.alert()
  }
}
