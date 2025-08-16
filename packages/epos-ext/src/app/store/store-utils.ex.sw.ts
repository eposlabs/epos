export class StoreUtils extends $exSw.Unit {
  private $store = this.up($exSw.Store, 'internal')!

  raw<T>(value: T): T {
    if (this.$.libs.mobx.isObservable(value) && this.$store.units.isUnit(value)) {
      const object: Obj = {}
      const keys = this.$store.units.getAnnotationKeys(value)
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
