export class PkgApiFrame extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!

  async open(name: string, url: string, attrs: Record<string, unknown> = {}) {
    await this.$.bus.send<number>('pkgs.createPkgFrame', this.$pkg.name, name, url, attrs)
  }

  async close(name: string) {
    await this.$.bus.send('pkgs.removePkgFrame', this.$pkg.name, name)
  }

  async list() {
    return await this.$.bus.send<{ name: string; url: string }[]>('pkgs.getPkgFrames', this.$pkg.name)
  }
}
