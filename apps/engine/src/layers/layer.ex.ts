import { Unit, type Unit as UnitType } from '../core/core-unit.ex'
import { App, type App as AppType } from '../units/app.ex'
import { Idb, type Idb as IdbType } from '../units/idb.ex'
import { Libs, type Libs as LibsType } from '../units/libs.ex'
import { ProjectBrowser, type ProjectBrowser as ProjectBrowserType } from '../units/project-browser.ex'
import { ProjectEposAssets, type ProjectEposAssets as ProjectEposAssetsType } from '../units/project-epos-assets.ex'
import { ProjectEposDom, type ProjectEposDom as ProjectEposDomType } from '../units/project-epos-dom.ex'
import { ProjectEposEnv, type ProjectEposEnv as ProjectEposEnvType } from '../units/project-epos-env.ex'
import { ProjectEposFrames, type ProjectEposFrames as ProjectEposFramesType } from '../units/project-epos-frames.ex'
import { ProjectEposGeneral, type ProjectEposGeneral as ProjectEposGeneralType } from '../units/project-epos-general.ex'
import { ProjectEposLibs, type ProjectEposLibs as ProjectEposLibsType } from '../units/project-epos-libs.ex'
import { ProjectEposProjects, type ProjectEposProjects as ProjectEposProjectsType } from '../units/project-epos-projects.ex'
import { ProjectEposState, type ProjectEposState as ProjectEposStateType } from '../units/project-epos-state.ex'
import { ProjectEposStorage, type ProjectEposStorage as ProjectEposStorageType } from '../units/project-epos-storage.ex'
import { ProjectEpos, type ProjectEpos as ProjectEposType } from '../units/project-epos.ex'
import { ProjectFetcher, type ProjectFetcher as ProjectFetcherType } from '../units/project-fetcher.ex'
import { Project, type Project as ProjectType } from '../units/project.ex'
import { Projects, type Projects as ProjectsType } from '../units/projects.ex'
import { Utils, type Utils as UtilsType } from '../units/utils.ex'

Object.assign(ex, {
  Unit,
  App,
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
  ProjectFetcher,
  Project,
  Projects,
  Utils,
})

declare global {
  const ex: Ex

  interface Ex extends Gl {
    Unit: typeof Unit
    App: typeof App
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
    ProjectFetcher: typeof ProjectFetcher
    Project: typeof Project
    Projects: typeof Projects
    Utils: typeof Utils
  }

  interface ex extends gl {
    Unit: Unit
    App: App
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
    ProjectFetcher: ProjectFetcher
    Project: Project
    Projects: Projects
    Utils: Utils
  }

  namespace ex {
    export type Unit = UnitType
    export type App = AppType
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
    export type ProjectFetcher = ProjectFetcherType
    export type Project = ProjectType
    export type Projects = ProjectsType
    export type Utils = UtilsType
  }
}
