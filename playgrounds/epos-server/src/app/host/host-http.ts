import type { ServerType } from '@hono/node-server'

export class HostHttp extends $gl.Unit {
  declare server: ServerType
  private $host = this.up($gl.Host)!

  async setup() {
    this.server = this.$.libs.honoServer.serve({
      fetch: this.$host.hono.app.fetch,
      port: this.$.port,
    })

    this.server.on('listening', () => {
      console.log(`[epos] Started at http://localhost:${this.$.port}\n`)
    })

    this.server.on('error', (error: Error & { code: string }) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${this.$.port} is already in use`)
        process.exit(1)
      } else {
        console.error('Server error', error)
        process.exit(1)
      }
    })
  }
}
