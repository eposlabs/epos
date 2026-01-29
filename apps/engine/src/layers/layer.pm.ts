import { App, type App as AppType } from '../units/app.pm.js'
import { Utils, type Utils as UtilsType } from '../units/utils.pm.js'

Object.assign(pm, {
  App,
  Utils,
})

declare global {
  const pm: Pm

  interface Pm extends Gl {
    App: typeof App
    Utils: typeof Utils
  }

  interface pm extends gl {
    App: App
    Utils: Utils
  }

  namespace pm {
    export type App = AppType
    export type Utils = UtilsType
  }
}
