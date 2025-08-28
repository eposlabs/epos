export class Host extends $gl.Unit {
  private hono = new $gl.HostHono(this)
  private http = new $gl.HostHttp(this)
  private ws = new $gl.HostWs(this)

  broadcast = this.ws.broadcast.bind(this.ws)

  async setup() {
    await this.http.setup()
    await this.ws.setup()
  }

  get internal() {
    return {
      hono: this.hono,
      http: this.http,
      ws: this.ws,
    }
  }
}
