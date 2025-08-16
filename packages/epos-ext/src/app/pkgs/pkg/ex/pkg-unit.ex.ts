export class PkgUnit extends $ex.Unit {
  Unit = this.$.store.Unit
  register = this.$.bind(this.$.store, 'register')
  units = this.$.bind(this.$.store, 'getRegisteredUnits')
}
