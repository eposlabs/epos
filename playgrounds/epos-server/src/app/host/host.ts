export class Host extends $gl.Unit {
  hono = new $gl.HostHono(this)
  http = new $gl.HostHttp(this)
  ws = new $gl.HostWs(this)

  broadcast = this.ws.broadcast.bind(this.ws)

  async setup() {
    await this.http.setup()
    await this.ws.setup()
  }
}
