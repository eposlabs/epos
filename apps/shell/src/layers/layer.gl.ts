import { ProjectsCreation, type ProjectsCreation as ProjectsCreationType } from '../_backup/projects-creation.js'
import { App, type App as AppType } from '../units/app.js'
import { Highlight, type Highlight as HighlightType } from '../units/highlight.js'
import { Idb, type Idb as IdbType } from '../units/idb.js'
import { Libs, type Libs as LibsType } from '../units/libs.js'
import { Permissions, type Permissions as PermissionsType } from '../units/permissions.js'
import { ProjectSetup, type ProjectSetup as ProjectSetupType } from '../units/project-setup.js'
import { ProjectWatcher, type ProjectWatcher as ProjectWatcherType } from '../units/project-watcher.js'
import { Project, type Project as ProjectType } from '../units/project.js'
import { Projects, type Projects as ProjectsType } from '../units/projects.js'
import { Theme, type Theme as ThemeType } from '../units/theme.js'
import { UtilsFs, type UtilsFs as UtilsFsType } from '../units/utils-fs.js'
import { Utils, type Utils as UtilsType } from '../units/utils.js'

Object.assign(gl, {
  ProjectsCreation,
  App,
  Highlight,
  Idb,
  Libs,
  Permissions,
  ProjectSetup,
  ProjectWatcher,
  Project,
  Projects,
  Theme,
  UtilsFs,
  Utils,
})

declare global {
  const gl: Gl

  interface Gl {
    ProjectsCreation: typeof ProjectsCreation
    App: typeof App
    Highlight: typeof Highlight
    Idb: typeof Idb
    Libs: typeof Libs
    Permissions: typeof Permissions
    ProjectSetup: typeof ProjectSetup
    ProjectWatcher: typeof ProjectWatcher
    Project: typeof Project
    Projects: typeof Projects
    Theme: typeof Theme
    UtilsFs: typeof UtilsFs
    Utils: typeof Utils
  }

  interface gl {
    ProjectsCreation: ProjectsCreation
    App: App
    Highlight: Highlight
    Idb: Idb
    Libs: Libs
    Permissions: Permissions
    ProjectSetup: ProjectSetup
    ProjectWatcher: ProjectWatcher
    Project: Project
    Projects: Projects
    Theme: Theme
    UtilsFs: UtilsFs
    Utils: Utils
  }

  namespace gl {
    export type ProjectsCreation = ProjectsCreationType
    export type App = AppType
    export type Highlight = HighlightType
    export type Idb = IdbType
    export type Libs = LibsType
    export type Permissions = PermissionsType
    export type ProjectSetup = ProjectSetupType
    export type ProjectWatcher = ProjectWatcherType
    export type Project = ProjectType
    export type Projects = ProjectsType
    export type Theme = ThemeType
    export type UtilsFs = UtilsFsType
    export type Utils = UtilsType
  }
}
