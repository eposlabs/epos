import { ProjectsCreation, type ProjectsCreation as ProjectsCreationType } from '../_backup/projects-creation.js'
import { App, type App as AppType } from '../app/app.js'
import { Idb, type Idb as IdbType } from '../idb/idb.js'
import { Libs, type Libs as LibsType } from '../libs/libs.js'
import { Permissions, type Permissions as PermissionsType } from '../permissions/permissions.js'
import { Project, type Project as ProjectType } from '../projects/project.js'
import { Projects, type Projects as ProjectsType } from '../projects/projects.js'
import { Theme, type Theme as ThemeType } from '../theme/theme.js'
import { Utils, type Utils as UtilsType } from '../utils/utils.js'

Object.assign(gl, {
  ProjectsCreation,
  App,
  Idb,
  Libs,
  Permissions,
  Project,
  Projects,
  Theme,
  Utils,
})

declare global {
  const gl: Gl

  interface Gl {
    ProjectsCreation: typeof ProjectsCreation
    App: typeof App
    Idb: typeof Idb
    Libs: typeof Libs
    Permissions: typeof Permissions
    Project: typeof Project
    Projects: typeof Projects
    Theme: typeof Theme
    Utils: typeof Utils
  }

  interface gl {
    ProjectsCreation: ProjectsCreation
    App: App
    Idb: Idb
    Libs: Libs
    Permissions: Permissions
    Project: Project
    Projects: Projects
    Theme: Theme
    Utils: Utils
  }

  namespace gl {
    export type ProjectsCreation = ProjectsCreationType
    export type App = AppType
    export type Idb = IdbType
    export type Libs = LibsType
    export type Permissions = PermissionsType
    export type Project = ProjectType
    export type Projects = ProjectsType
    export type Theme = ThemeType
    export type Utils = UtilsType
  }
}
