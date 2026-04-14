import { Unit } from '@eposlabs/utils'

export class BaseUnit<T extends cs.App | ex.App | os.App | pm.App | sw.App | vw.App> extends Unit<T> {
  use<T extends Obj<any>>(bundle: string, id?: string) {
    const idPart = id ? `[${id}]` : ''
    return this.$.bus.use<T>(`${this.constructor.name}${idPart}[${bundle}]`)
  }

  expose(id?: string) {
    const idPart = id ? `[${id}]` : ''
    this.$.bus.register(`${this.constructor.name}${idPart}[${BUNDLE}]`, this)
  }

  unexpose(id?: string) {
    const idPart = id ? `[${id}]` : ''
    this.$.bus.unregister(`${this.constructor.name}${idPart}[${BUNDLE}]`)
  }
}
