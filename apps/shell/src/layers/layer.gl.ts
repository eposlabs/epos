import { Unit, type Unit as UnitType } from '../core/core-unit'
import { App, type App as AppType } from '../units/app'
import { Highlight, type Highlight as HighlightType } from '../units/highlight'
import { Idb, type Idb as IdbType } from '../units/idb'
import { Libs, type Libs as LibsType } from '../units/libs'
import { Permissions, type Permissions as PermissionsType } from '../units/permissions'
import { ProjectSetup, type ProjectSetup as ProjectSetupType } from '../units/project-setup'
import { ProjectWatcher, type ProjectWatcher as ProjectWatcherType } from '../units/project-watcher'
import { Project, type Project as ProjectType } from '../units/project'
import { Projects, type Projects as ProjectsType } from '../units/projects'
import { Theme, type Theme as ThemeType } from '../units/theme'
import { Toast, type Toast as ToastType } from '../units/toast'
import { UtilsFs, type UtilsFs as UtilsFsType } from '../units/utils-fs'
import { Utils, type Utils as UtilsType } from '../units/utils'
import { Welcome, type Welcome as WelcomeType } from '../units/welcome'

Object.assign(gl, {
  Unit,
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
  Toast,
  UtilsFs,
  Utils,
  Welcome,
})

declare global {
  const gl: Gl

  interface Gl {
    Unit: typeof Unit
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
    Toast: typeof Toast
    UtilsFs: typeof UtilsFs
    Utils: typeof Utils
    Welcome: typeof Welcome
  }

  interface gl {
    Unit: Unit
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
    Toast: Toast
    UtilsFs: UtilsFs
    Utils: Utils
    Welcome: Welcome
  }

  namespace gl {
    export type Unit = UnitType
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
    export type Toast = ToastType
    export type UtilsFs = UtilsFsType
    export type Utils = UtilsType
    export type Welcome = WelcomeType
  }
}
