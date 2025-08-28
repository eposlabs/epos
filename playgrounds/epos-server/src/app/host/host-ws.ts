import type { Server } from 'http'
import type { WebSocketServer } from 'ws'

export class HostWs extends $gl.Unit {
  private $host = this.up($gl.Host)!
  declare private server: WebSocketServer

  async setup() {
    this.server = new this.$.libs.ws.WebSocketServer({
      server: this.$host.http.server as Server,
    })
  }

  broadcast(data = {}) {
    const json = JSON.stringify(data)
    this.server.clients.forEach(c => c.send(json))
  }
}
