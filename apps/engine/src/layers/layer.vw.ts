import { App, type App as AppType } from '../units/app.vw.js'
import { Project, type Project as ProjectType } from '../units/project.vw.js'
import { Projects, type Projects as ProjectsType } from '../units/projects.vw.js'
import { Utils, type Utils as UtilsType } from '../units/utils.vw.js'

Object.assign(vw, {
  App,
  Project,
  Projects,
  Utils,
})

declare global {
  const vw: Vw

  interface Vw extends Gl {
    App: typeof App
    Project: typeof Project
    Projects: typeof Projects
    Utils: typeof Utils
  }

  interface vw extends gl {
    App: App
    Project: Project
    Projects: Projects
    Utils: Utils
  }

  namespace vw {
    export type App = AppType
    export type Project = ProjectType
    export type Projects = ProjectsType
    export type Utils = UtilsType
  }
}
