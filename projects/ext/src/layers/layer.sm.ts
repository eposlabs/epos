import { App, type App as AppType } from '../app/app.sm.ts'
import { KitBrowser, type KitBrowser as KitBrowserType } from '../app/kit/kit-browser.sm.ts'
import { Kit, type Kit as KitType } from '../app/kit/kit.sm.ts'
import { Utils, type Utils as UtilsType } from '../app/utils/utils.sm.ts'

Object.assign($sm, {
  App,
  KitBrowser,
  Kit,
  Utils,
})

declare global {
  var $sm: $Sm

  interface $Sm {
    App: typeof App
    KitBrowser: typeof KitBrowser
    Kit: typeof Kit
    Utils: typeof Utils
  }

  namespace $sm {
    export type App = AppType
    export type KitBrowser = KitBrowserType
    export type Kit = KitType
    export type Utils = UtilsType
  }
}
