import { App, type App as AppType } from '../app/app.sm.ts'
import { ToolsBrowser, type ToolsBrowser as ToolsBrowserType } from '../app/tools/tools-browser.sm.ts'
import { Tools, type Tools as ToolsType } from '../app/tools/tools.sm.ts'
import { Utils, type Utils as UtilsType } from '../app/utils/utils.sm.ts'

Object.assign($sm, {
  App,
  ToolsBrowser,
  Tools,
  Utils,
})

declare global {
  var $sm: $Sm

  interface $Sm {
    App: typeof App
    ToolsBrowser: typeof ToolsBrowser
    Tools: typeof Tools
    Utils: typeof Utils
  }

  namespace $sm {
    export type App = AppType
    export type ToolsBrowser = ToolsBrowserType
    export type Tools = ToolsType
    export type Utils = UtilsType
  }
}
