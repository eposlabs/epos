import { App, type App as AppType } from '../app/app.sm.ts'
import { Utils, type Utils as UtilsType } from '../app/utils/utils.sm.ts'

Object.assign($sm, {
  App,
  Utils,
})

declare global {
  var $sm: $Sm

  interface $Sm {
    App: typeof App
    Utils: typeof Utils
  }

  namespace $sm {
    export type App = AppType
    export type Utils = UtilsType
  }
}
