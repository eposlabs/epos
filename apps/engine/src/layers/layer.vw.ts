import { Unit, type Unit as UnitType } from '../core/core-unit.vw'
import { App, type App as AppType } from '../units/app.vw'
import { Project, type Project as ProjectType } from '../units/project.vw'
import { Projects, type Projects as ProjectsType } from '../units/projects.vw'
import { Utils, type Utils as UtilsType } from '../units/utils.vw'

Object.assign(vw, {
  Unit,
  App,
  Project,
  Projects,
  Utils,
})

declare global {
  const vw: Vw

  interface Vw extends Gl {
    Unit: typeof Unit
    App: typeof App
    Project: typeof Project
    Projects: typeof Projects
    Utils: typeof Utils
  }

  interface vw extends gl {
    Unit: Unit
    App: App
    Project: Project
    Projects: Projects
    Utils: Utils
  }

  namespace vw {
    export type Unit = UnitType
    export type App = AppType
    export type Project = ProjectType
    export type Projects = ProjectsType
    export type Utils = UtilsType
  }
}
