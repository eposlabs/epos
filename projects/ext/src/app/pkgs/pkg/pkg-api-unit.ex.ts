export class PkgApiUnit extends $ex.Unit {
  private $pkg = this.up($ex.Pkg)!
  Unit = this.$.units.Unit
  register = this.$.units.register.bind(this.$.units, this.$pkg.name)
  units = () => this.$.units.map[this.$pkg.name] ?? {}
}
