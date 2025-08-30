export class PkgUnit extends $ex.Unit {
  Unit = this.$.states.units.Unit
  register = this.$.utils.link(this.$.states.units, 'register')
  units = () => this.$.states.units.map
}
