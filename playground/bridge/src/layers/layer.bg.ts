import { App, type App as AppType } from '../units/app.bg.js'

Object.assign(bg, {
  App,
})

declare global {
  const bg: Bg

  interface Bg extends Gl {
    App: typeof App
  }

  interface bg extends gl {
    App: App
  }

  namespace bg {
    export type App = AppType
  }
}
