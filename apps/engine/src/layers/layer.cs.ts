import { Unit, type Unit as UnitType } from '../core/core-unit.cs'
import { App, type App as AppType } from '../units/app.cs'
import { Libs, type Libs as LibsType } from '../units/libs.cs'
import { Projects, type Projects as ProjectsType } from '../units/projects.cs'
import { Utils, type Utils as UtilsType } from '../units/utils.cs'

Object.assign(cs, {
  Unit,
  App,
  Libs,
  Projects,
  Utils,
})

declare global {
  const cs: Cs

  interface Cs extends Gl {
    Unit: typeof Unit
    App: typeof App
    Libs: typeof Libs
    Projects: typeof Projects
    Utils: typeof Utils
  }

  interface cs extends gl {
    Unit: Unit
    App: App
    Libs: Libs
    Projects: Projects
    Utils: Utils
  }

  namespace cs {
    export type Unit = UnitType
    export type App = AppType
    export type Libs = LibsType
    export type Projects = ProjectsType
    export type Utils = UtilsType
  }
}
