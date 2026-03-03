import { App, type App as AppType } from '../app/app.vw.js'
import { Project, type Project as ProjectType } from '../projects/project.vw.js'
import { Projects, type Projects as ProjectsType } from '../projects/projects.vw.js'
import { Utils, type Utils as UtilsType } from '../utils/utils.vw.js'

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
