import { App, type App as AppType } from '../units/app.js'
import { Idb, type Idb as IdbType } from '../units/idb.js'
import { Learn, type Learn as LearnType } from '../units/learn.js'
import { Libs, type Libs as LibsType } from '../units/libs.js'
import { Permission, type Permission as PermissionType } from '../units/permission.js'
import { Project, type Project as ProjectType } from '../units/project.js'
import { Projects, type Projects as ProjectsType } from '../units/projects.js'
import { Theme, type Theme as ThemeType } from '../units/theme.js'
import { Utils, type Utils as UtilsType } from '../units/utils.js'

Object.assign(gl, {
  App,
  Idb,
  Learn,
  Libs,
  Permission,
  Project,
  Projects,
  Theme,
  Utils,
})

declare global {
  const gl: Gl

  interface Gl {
    App: typeof App
    Idb: typeof Idb
    Learn: typeof Learn
    Libs: typeof Libs
    Permission: typeof Permission
    Project: typeof Project
    Projects: typeof Projects
    Theme: typeof Theme
    Utils: typeof Utils
  }

  interface gl {
    App: App
    Idb: Idb
    Learn: Learn
    Libs: Libs
    Permission: Permission
    Project: Project
    Projects: Projects
    Theme: Theme
    Utils: Utils
  }

  namespace gl {
    export type App = AppType
    export type Idb = IdbType
    export type Learn = LearnType
    export type Libs = LibsType
    export type Permission = PermissionType
    export type Project = ProjectType
    export type Projects = ProjectsType
    export type Theme = ThemeType
    export type Utils = UtilsType
  }
}
