export class App extends gl.App<fg> {
  get bg() {
    return this.use<bg.App>('bg')
  }

  attach() {
    this.expose('fg')
  }

  alert() {
    alert('hello')
  }

  View() {
    return <div onClick={() => this.bg.spawn()}>APP</div>
  }
}
