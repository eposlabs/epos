export class PkgApiFrames extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!

  async create(name: string, url: string, attrs: Record<string, unknown> = {}) {
    await this.$.bus.send<number>('pack.createPkgFrame', this.$pkg.name, name, url, attrs)
  }

  async remove(name: string) {
    await this.$.bus.send('pack.removePkgFrame', this.$pkg.name, name)
  }

  async list() {
    return await this.$.bus.send<{ name: string; url: string }[]>('pack.getPkgFrames', this.$pkg.name)
  }
}
