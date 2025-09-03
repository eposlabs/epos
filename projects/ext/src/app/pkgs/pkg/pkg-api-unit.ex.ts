export class PkgApiUnit extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!
  Unit = this.$.units.Unit
  units = () => this.$.units.map[this.$pkg.name] ?? {}
  register = this.$.units.register.bind(this.$.units, this.$pkg.name)
}
