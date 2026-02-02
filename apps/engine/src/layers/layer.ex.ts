import { App, type App as AppType } from '../app/app.ex.js'
import { Fetcher, type Fetcher as FetcherType } from '../fetcher/fetcher.ex.js'
import { Idb, type Idb as IdbType } from '../idb/idb.ex.js'
import { Libs, type Libs as LibsType } from '../libs/libs.ex.js'
import { ProjectBrowser, type ProjectBrowser as ProjectBrowserType } from '../project/project-browser.ex.js'
import { ProjectEposAssets, type ProjectEposAssets as ProjectEposAssetsType } from '../project/project-epos-assets.ex.js'
import { ProjectEposDom, type ProjectEposDom as ProjectEposDomType } from '../project/project-epos-dom.ex.js'
import { ProjectEposEnv, type ProjectEposEnv as ProjectEposEnvType } from '../project/project-epos-env.ex.js'
import { ProjectEposFrames, type ProjectEposFrames as ProjectEposFramesType } from '../project/project-epos-frames.ex.js'
import { ProjectEposGeneral, type ProjectEposGeneral as ProjectEposGeneralType } from '../project/project-epos-general.ex.js'
import { ProjectEposLibs, type ProjectEposLibs as ProjectEposLibsType } from '../project/project-epos-libs.ex.js'
import { ProjectEposProjects, type ProjectEposProjects as ProjectEposProjectsType } from '../project/project-epos-projects.ex.js'
import { ProjectEposState, type ProjectEposState as ProjectEposStateType } from '../project/project-epos-state.ex.js'
import { ProjectEposStorage, type ProjectEposStorage as ProjectEposStorageType } from '../project/project-epos-storage.ex.js'
import { ProjectEpos, type ProjectEpos as ProjectEposType } from '../project/project-epos.ex.js'
import { Project, type Project as ProjectType } from '../project/project.ex.js'
import { Projects, type Projects as ProjectsType } from '../projects/projects.ex.js'
import { Utils, type Utils as UtilsType } from '../utils/utils.ex.js'

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
