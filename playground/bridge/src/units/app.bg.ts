export class App extends gl.App<bg> {
  get fg() {
    return this.rpc<fg.App>('fg')
  }

  attach() {
    this.registerRpc('bg')
  }

  async spawn() {
    this.log('SPAWN')
    await this.fg.alert()
  }
}
