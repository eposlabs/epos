import type { Context } from 'hono'

export class HostHono extends $gl.Unit {
  app = new this.$.libs.hono.Hono()

  private paths = {
    hubHtml: '../../../static/hub.html',
    mainHtml: '../../../static/main.html',
    favicon: '../../../static/favicon.png',
  }

  constructor(parent: $gl.Unit) {
    super(parent)
    this.app.get('/', this.main)
    this.app.get(`/:prefix{@[a-z0-9-]+}`, this.hub)
    this.app.get(`/:prefix{@[a-z0-9-]+}/*`, this.hub)
    this.app.get(`/@/:name{[a-z0-9-]+}`, this.source)
    this.app.get(`/@/:name{[a-z0-9-]+}/*`, this.source)
    this.app.get('/favicon.ico', this.favicon)
  }

  private main = async (c: Context) => {
    const path = this.resolve(this.paths.mainHtml)
    const html = await this.$.libs.fs.readFile(path, 'utf-8')
    return c.html(html)
  }

  private hub = async (c: Context) => {
    const path = this.resolve(this.paths.hubHtml)
    const html = await this.$.libs.fs.readFile(path, 'utf-8')
    return c.html(html)
  }

  private source = async (c: Context) => {
    const name = c.req.param('name')
    const filePath = c.req.path.split('/').slice(3).join('/')
    if (!filePath) return c.redirect(`/@/${name}/epos.json`, 301)

    const pkg = this.$.pkgs.get(name)
    if (!pkg) return c.notFound()

    const file = await pkg.read(filePath)
    if (!file) return c.notFound()

    return c.body(file.content, 200, { 'Content-Type': file.type })
  }

  private favicon = async (c: Context) => {
    const path = this.resolve(this.paths.favicon)
    const image = await this.$.libs.fs.readFile(path)
    return c.body(image, 200, { 'Content-Type': 'image/png' })
  }

  private resolve(path: string) {
    return this.$.libs.path.resolve(import.meta.dirname, path)
  }
}
