import { App, type App as AppType } from '../app/app.ex.js'
import { Fetcher, type Fetcher as FetcherType } from '../fetcher/fetcher.ex.js'
import { Idb, type Idb as IdbType } from '../idb/idb.ex.js'
import { Libs, type Libs as LibsType } from '../libs/libs.ex.js'
import { ProjectBrowser, type ProjectBrowser as ProjectBrowserType } from '../projects/project-browser.ex.js'
import { ProjectEposAssets, type ProjectEposAssets as ProjectEposAssetsType } from '../projects/project-epos-assets.ex.js'
import { ProjectEposDom, type ProjectEposDom as ProjectEposDomType } from '../projects/project-epos-dom.ex.js'
import { ProjectEposEnv, type ProjectEposEnv as ProjectEposEnvType } from '../projects/project-epos-env.ex.js'
import { ProjectEposFrames, type ProjectEposFrames as ProjectEposFramesType } from '../projects/project-epos-frames.ex.js'
import { ProjectEposGeneral, type ProjectEposGeneral as ProjectEposGeneralType } from '../projects/project-epos-general.ex.js'
import { ProjectEposLibs, type ProjectEposLibs as ProjectEposLibsType } from '../projects/project-epos-libs.ex.js'
import { ProjectEposProjects, type ProjectEposProjects as ProjectEposProjectsType } from '../projects/project-epos-projects.ex.js'
import { ProjectEposState, type ProjectEposState as ProjectEposStateType } from '../projects/project-epos-state.ex.js'
import { ProjectEposStorage, type ProjectEposStorage as ProjectEposStorageType } from '../projects/project-epos-storage.ex.js'
import { ProjectEpos, type ProjectEpos as ProjectEposType } from '../projects/project-epos.ex.js'
import { Project, type Project as ProjectType } from '../projects/project.ex.js'
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
