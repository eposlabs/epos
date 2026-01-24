import { App, type App as AppType } from '../units/app.fg.js'

Object.assign(fg, {
  App,
})

declare global {
  const fg: Fg

  interface Fg extends Gl {
    App: typeof App
  }

  interface fg extends gl {
    App: App
  }

  namespace fg {
    export type App = AppType
  }
}
