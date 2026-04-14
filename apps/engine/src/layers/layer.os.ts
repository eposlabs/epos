import { Unit, type Unit as UnitType } from '../core/core-unit.os.ts'
import { Alive, type Alive as AliveType } from '../units/alive.os.ts'
import { App, type App as AppType } from '../units/app.os.ts'
import { Project, type Project as ProjectType } from '../units/project.os.ts'
import { Projects, type Projects as ProjectsType } from '../units/projects.os.ts'
import { Utils, type Utils as UtilsType } from '../units/utils.os.ts'

Object.assign(os, {
  Unit,
  Alive,
  App,
  Project,
  Projects,
  Utils,
})

declare global {
  const os: Os

  interface Os extends Gl {
    Unit: typeof Unit
    Alive: typeof Alive
    App: typeof App
    Project: typeof Project
    Projects: typeof Projects
    Utils: typeof Utils
  }

  interface os extends gl {
    Unit: Unit
    Alive: Alive
    App: App
    Project: Project
    Projects: Projects
    Utils: Utils
  }

  namespace os {
    export type Unit = UnitType
    export type Alive = AliveType
    export type App = AppType
    export type Project = ProjectType
    export type Projects = ProjectsType
    export type Utils = UtilsType
  }
}
