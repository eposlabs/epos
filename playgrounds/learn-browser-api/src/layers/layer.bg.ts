import { App, type App as AppType } from '../app/app.bg'

Object.assign($bg, {
  App,
})

declare global {
  var $bg: $Bg

  interface $Bg {
    App: typeof App
  }

  namespace $bg {
    export type App = AppType
  }
}
