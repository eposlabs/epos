import { Alive, type Alive as AliveType } from '../units/alive.os.js'
import { App, type App as AppType } from '../units/app.os.js'
import { Project, type Project as ProjectType } from '../units/project.os.js'
import { Projects, type Projects as ProjectsType } from '../units/projects.os.js'
import { Utils, type Utils as UtilsType } from '../units/utils.os.js'

Object.assign(os, {
  Alive,
  App,
  Project,
  Projects,
  Utils,
})

declare global {
  const os: Os

  interface Os extends Gl {
    Alive: typeof Alive
    App: typeof App
    Project: typeof Project
    Projects: typeof Projects
    Utils: typeof Utils
  }

  interface os extends gl {
    Alive: Alive
    App: App
    Project: Project
    Projects: Projects
    Utils: Utils
  }

  namespace os {
    export type Alive = AliveType
    export type App = AppType
    export type Project = ProjectType
    export type Projects = ProjectsType
    export type Utils = UtilsType
  }
}
