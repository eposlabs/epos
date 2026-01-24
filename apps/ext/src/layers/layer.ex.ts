import { App, type App as AppType } from '../units/app.ex.js'
import { Fetcher, type Fetcher as FetcherType } from '../units/fetcher.ex.js'
import { Idb, type Idb as IdbType } from '../units/idb.ex.js'
import { Libs, type Libs as LibsType } from '../units/libs.ex.js'
import { ProjectBrowser, type ProjectBrowser as ProjectBrowserType } from '../units/project-browser.ex.js'
import { ProjectEposAssets, type ProjectEposAssets as ProjectEposAssetsType } from '../units/project-epos-assets.ex.js'
import { ProjectEposDom, type ProjectEposDom as ProjectEposDomType } from '../units/project-epos-dom.ex.js'
import { ProjectEposEnv, type ProjectEposEnv as ProjectEposEnvType } from '../units/project-epos-env.ex.js'
import { ProjectEposFrames, type ProjectEposFrames as ProjectEposFramesType } from '../units/project-epos-frames.ex.js'
import { ProjectEposGeneral, type ProjectEposGeneral as ProjectEposGeneralType } from '../units/project-epos-general.ex.js'
import { ProjectEposLibs, type ProjectEposLibs as ProjectEposLibsType } from '../units/project-epos-libs.ex.js'
import { ProjectEposProjects, type ProjectEposProjects as ProjectEposProjectsType } from '../units/project-epos-projects.ex.js'
import { ProjectEposState, type ProjectEposState as ProjectEposStateType } from '../units/project-epos-state.ex.js'
import { ProjectEposStorage, type ProjectEposStorage as ProjectEposStorageType } from '../units/project-epos-storage.ex.js'
import { ProjectEpos, type ProjectEpos as ProjectEposType } from '../units/project-epos.ex.js'
import { Project, type Project as ProjectType } from '../units/project.ex.js'
import { Projects, type Projects as ProjectsType } from '../units/projects.ex.js'
import { Utils, type Utils as UtilsType } from '../units/utils.ex.js'

Object.assign(ex, {
  App,
  Fetcher,
  Idb,
  Libs,
  ProjectBrowser,
  ProjectEposAssets,
  ProjectEposDom,
  ProjectEposEnv,
  ProjectEposFrames,
  ProjectEposGeneral,
  ProjectEposLibs,
  ProjectEposProjects,
  ProjectEposState,
  ProjectEposStorage,
  ProjectEpos,
  Project,
  Projects,
  Utils,
})

declare global {
  const ex: Ex

  interface Ex extends Gl {
    App: typeof App
    Fetcher: typeof Fetcher
    Idb: typeof Idb
    Libs: typeof Libs
    ProjectBrowser: typeof ProjectBrowser
    ProjectEposAssets: typeof ProjectEposAssets
    ProjectEposDom: typeof ProjectEposDom
    ProjectEposEnv: typeof ProjectEposEnv
    ProjectEposFrames: typeof ProjectEposFrames
    ProjectEposGeneral: typeof ProjectEposGeneral
    ProjectEposLibs: typeof ProjectEposLibs
    ProjectEposProjects: typeof ProjectEposProjects
    ProjectEposState: typeof ProjectEposState
    ProjectEposStorage: typeof ProjectEposStorage
    ProjectEpos: typeof ProjectEpos
    Project: typeof Project
    Projects: typeof Projects
    Utils: typeof Utils
  }

  interface ex extends gl {
    App: App
    Fetcher: Fetcher
    Idb: Idb
    Libs: Libs
    ProjectBrowser: ProjectBrowser
    ProjectEposAssets: ProjectEposAssets
    ProjectEposDom: ProjectEposDom
    ProjectEposEnv: ProjectEposEnv
    ProjectEposFrames: ProjectEposFrames
    ProjectEposGeneral: ProjectEposGeneral
    ProjectEposLibs: ProjectEposLibs
    ProjectEposProjects: ProjectEposProjects
    ProjectEposState: ProjectEposState
    ProjectEposStorage: ProjectEposStorage
    ProjectEpos: ProjectEpos
    Project: Project
    Projects: Projects
    Utils: Utils
  }

  namespace ex {
    export type App = AppType
    export type Fetcher = FetcherType
    export type Idb = IdbType
    export type Libs = LibsType
    export type ProjectBrowser = ProjectBrowserType
    export type ProjectEposAssets = ProjectEposAssetsType
    export type ProjectEposDom = ProjectEposDomType
    export type ProjectEposEnv = ProjectEposEnvType
    export type ProjectEposFrames = ProjectEposFramesType
    export type ProjectEposGeneral = ProjectEposGeneralType
    export type ProjectEposLibs = ProjectEposLibsType
    export type ProjectEposProjects = ProjectEposProjectsType
    export type ProjectEposState = ProjectEposStateType
    export type ProjectEposStorage = ProjectEposStorageType
    export type ProjectEpos = ProjectEposType
    export type Project = ProjectType
    export type Projects = ProjectsType
    export type Utils = UtilsType
  }
}
