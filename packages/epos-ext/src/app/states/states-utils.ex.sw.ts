export class StatesUtils extends $exSw.Unit {
  private $units = this.up($exSw.States)!.units

  raw<T>(value: T): T {
    if (this.$.libs.mobx.isObservable(value) && this.$units.isUnit(value)) {
      const object: Obj = {}
      const keys = this.$units.getKeys(value)
      for (const key of keys) {
        object[key] = this.raw((value as Obj)[key])
      }
      return object as T
    }

    if (this.$.is.object(value)) {
      const object: Obj = {}
      for (const key in value) {
        object[key] = this.raw(value[key])
      }
      return object as T
    }

    if (this.$.is.array(value)) {
      return value.map(v => this.raw(v)) as T
    }

    return value
  }
}
