export class Env extends gl.Unit {
  is = new gl.EnvIs(this)
  url = new gl.EnvUrl(this)
  params = this.getParams()

  private getParams() {
    const { protocol, searchParams } = new URL(location.href)
    if (protocol !== 'chrome-extension:') return {}
    return Object.fromEntries(searchParams.entries())
  }
}
