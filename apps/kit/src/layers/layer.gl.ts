import { App, type App as AppType } from '../units/app.js'
import { Idb, type Idb as IdbType } from '../units/idb.js'
import { Libs, type Libs as LibsType } from '../units/libs.js'
import { Permissions, type Permissions as PermissionsType } from '../units/permissions.js'
import { Project, type Project as ProjectType } from '../units/project.js'
import { ProjectsCreation, type ProjectsCreation as ProjectsCreationType } from '../units/projects-creation.js'
import { Projects, type Projects as ProjectsType } from '../units/projects.js'
import { Theme, type Theme as ThemeType } from '../units/theme.js'
import { Utils, type Utils as UtilsType } from '../units/utils.js'

Object.assign(gl, {
  App,
  Idb,
  Libs,
  Permissions,
  Project,
  ProjectsCreation,
  Projects,
  Theme,
  Utils,
})

declare global {
  const gl: Gl

  interface Gl {
    App: typeof App
    Idb: typeof Idb
    Libs: typeof Libs
    Permissions: typeof Permissions
    Project: typeof Project
    ProjectsCreation: typeof ProjectsCreation
    Projects: typeof Projects
    Theme: typeof Theme
    Utils: typeof Utils
  }

  interface gl {
    App: App
    Idb: Idb
    Libs: Libs
    Permissions: Permissions
    Project: Project
    ProjectsCreation: ProjectsCreation
    Projects: Projects
    Theme: Theme
    Utils: Utils
  }

  namespace gl {
    export type App = AppType
    export type Idb = IdbType
    export type Libs = LibsType
    export type Permissions = PermissionsType
    export type Project = ProjectType
    export type ProjectsCreation = ProjectsCreationType
    export type Projects = ProjectsType
    export type Theme = ThemeType
    export type Utils = UtilsType
  }
}
