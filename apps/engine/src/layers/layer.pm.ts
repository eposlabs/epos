import { Unit, type Unit as UnitType } from '../core/core-unit.pm.ts'
import { App, type App as AppType } from '../units/app.pm.ts'
import { Utils, type Utils as UtilsType } from '../units/utils.pm.ts'

Object.assign(pm, {
  Unit,
  App,
  Utils,
})

declare global {
  const pm: Pm

  interface Pm extends Gl {
    Unit: typeof Unit
    App: typeof App
    Utils: typeof Utils
  }

  interface pm extends gl {
    Unit: Unit
    App: App
    Utils: Utils
  }

  namespace pm {
    export type Unit = UnitType
    export type App = AppType
    export type Utils = UtilsType
  }
}
