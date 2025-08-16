// TODO: unit support here (?)
// local state should support owner as well for units to work
// and onChange we need to handle detach
export class StoreLocalState extends $exSw.Unit {
  private $units = this.up($exSw.Store, 'internal')!.units

  create(data: unknown) {
    if (this.$.is.object(data)) {
      return this.createFromObject(data)
    } else if (this.$.is.array(data)) {
      return this.createFromArray(data)
    }

    return data
  }

  createFromObject(object: Obj, owner) {
    const spec = object['@']
    const isUnit = this.$units.isUnitSpec(spec)

    let empty
    if (isUnit) {
      empty = this.createEmptyMobxUnit(spec, Object.keys(object))
    } else {
      empty = this.$.libs.mobx.observable.object({}, {}, { deep: false })
    }
    for (const key in object) {
      empty[key] = this.create(object[key], owner)
    }
    this.hydrate(empty)

    if (isUnit) {
      this.$units.setup(empty)
    }

    return empty
  }

  private createEmptyMobxUnit(spec: string, keys: string[]) {
    // Create empty unit shape and construct MobX annotations
    const unit: MObj = {}
    const annotations: Record<string, IObservableFactory['ref']> = {}
    for (const key of keys) {
      unit[key] = undefined
      annotations[key] = this.$.libs.mobx.observable
    }

    // Make unit observable
    this.$.libs.mobx.makeObservable(unit, annotations, { deep: false })

    // Apply unit prototype. Must be called after 'makeObservable' otherwise keys
    // become non-configurable and we can't delete them during versioning.
    const Unit = this.$units.getClassBySpec(spec)
    if (!Unit) throw this.never
    Reflect.setPrototypeOf(unit, Unit.prototype)

    return unit
  }

  createFromArray(array: Arr, owner) {
    const empty: Arr = this.$.libs.mobx.observable.array([], { deep: false })
    this.attach(emprt, owner)
    for (const item of array) {
      empty.push(this.create(item), empty)
    }
    this.observe(empty, owner)
    return empty
  }

  hydrate(state: any, owner) {
    this.$.libs.mobx.intercept(state, this.onChange as any)
    state[_owner_] = owner

    Reflect.defineProperty(state, '_', {
      get: () => this.$.libs.mobx.toJS(state),
    })
  }

  onChange = change => {
    change.newValue = this.create(change.newValue)
    return change
  }
}
