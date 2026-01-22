export class App extends gl.App<fg> {
  get bg() {
    return this.rpc<bg.App>('bg')
  }

  attach() {
    this.registerRpc('fg')
  }

  alert() {
    alert('hello')
  }

  View() {
    return <div onClick={() => this.bg.spawn()}>APP</div>
  }
}
