import { App, type App as AppType } from '../units/app.cs.js'
import { Libs, type Libs as LibsType } from '../units/libs.cs.js'
import { Projects, type Projects as ProjectsType } from '../units/projects.cs.js'
import { Utils, type Utils as UtilsType } from '../units/utils.cs.js'

Object.assign(cs, {
  App,
  Libs,
  Projects,
  Utils,
})

declare global {
  const cs: Cs

  interface Cs extends Gl {
    App: typeof App
    Libs: typeof Libs
    Projects: typeof Projects
    Utils: typeof Utils
  }

  interface cs extends gl {
    App: App
    Libs: Libs
    Projects: Projects
    Utils: Utils
  }

  namespace cs {
    export type App = AppType
    export type Libs = LibsType
    export type Projects = ProjectsType
    export type Utils = UtilsType
  }
}
