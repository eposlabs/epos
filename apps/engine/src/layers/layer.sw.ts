import { Unit, type Unit as UnitType } from '../core/core-unit.sw'
import { Alive, type Alive as AliveType } from '../units/alive.sw'
import { App, type App as AppType } from '../units/app.sw'
import { Idb, type Idb as IdbType } from '../units/idb.sw'
import { Libs, type Libs as LibsType } from '../units/libs.sw'
import { Net, type Net as NetType } from '../units/net.sw'
import { Peer, type Peer as PeerType } from '../units/peer.sw'
import { ProjectBrowserAlarms, type ProjectBrowserAlarms as ProjectBrowserAlarmsType } from '../units/project-browser-alarms.sw'
import { ProjectBrowserContextMenus, type ProjectBrowserContextMenus as ProjectBrowserContextMenusType } from '../units/project-browser-context-menus.sw'
import { ProjectBrowserDeclarativeNetRequest, type ProjectBrowserDeclarativeNetRequest as ProjectBrowserDeclarativeNetRequestType } from '../units/project-browser-declarative-net-request.sw'
import { ProjectBrowserNotifications, type ProjectBrowserNotifications as ProjectBrowserNotificationsType } from '../units/project-browser-notifications.sw'
import { ProjectBrowserPermissions, type ProjectBrowserPermissions as ProjectBrowserPermissionsType } from '../units/project-browser-permissions.sw'
import { ProjectBrowserStorageArea, type ProjectBrowserStorageArea as ProjectBrowserStorageAreaType } from '../units/project-browser-storage-area.sw'
import { ProjectBrowserStorage, type ProjectBrowserStorage as ProjectBrowserStorageType } from '../units/project-browser-storage.sw'
import { ProjectBrowser, type ProjectBrowser as ProjectBrowserType } from '../units/project-browser.sw'
import { ProjectFetcher, type ProjectFetcher as ProjectFetcherType } from '../units/project-fetcher.sw'
import { ProjectTarget, type ProjectTarget as ProjectTargetType } from '../units/project-target.sw'
import { Project, type Project as ProjectType } from '../units/project.sw'
import { Projects, type Projects as ProjectsType } from '../units/projects.sw'
import { Shell, type Shell as ShellType } from '../units/shell.sw'
import { UtilsOrigins, type UtilsOrigins as UtilsOriginsType } from '../units/utils-origins.sw'
import { Utils, type Utils as UtilsType } from '../units/utils.sw'

Object.assign(sw, {
  Unit,
  Alive,
  App,
  Idb,
  Libs,
  Net,
  Peer,
  ProjectBrowserAlarms,
  ProjectBrowserContextMenus,
  ProjectBrowserDeclarativeNetRequest,
  ProjectBrowserNotifications,
  ProjectBrowserPermissions,
  ProjectBrowserStorageArea,
  ProjectBrowserStorage,
  ProjectBrowser,
  ProjectFetcher,
  ProjectTarget,
  Project,
  Projects,
  Shell,
  UtilsOrigins,
  Utils,
})

declare global {
  const sw: Sw

  interface Sw extends Gl {
    Unit: typeof Unit
    Alive: typeof Alive
    App: typeof App
    Idb: typeof Idb
    Libs: typeof Libs
    Net: typeof Net
    Peer: typeof Peer
    ProjectBrowserAlarms: typeof ProjectBrowserAlarms
    ProjectBrowserContextMenus: typeof ProjectBrowserContextMenus
    ProjectBrowserDeclarativeNetRequest: typeof ProjectBrowserDeclarativeNetRequest
    ProjectBrowserNotifications: typeof ProjectBrowserNotifications
    ProjectBrowserPermissions: typeof ProjectBrowserPermissions
    ProjectBrowserStorageArea: typeof ProjectBrowserStorageArea
    ProjectBrowserStorage: typeof ProjectBrowserStorage
    ProjectBrowser: typeof ProjectBrowser
    ProjectFetcher: typeof ProjectFetcher
    ProjectTarget: typeof ProjectTarget
    Project: typeof Project
    Projects: typeof Projects
    Shell: typeof Shell
    UtilsOrigins: typeof UtilsOrigins
    Utils: typeof Utils
  }

  interface sw extends gl {
    Unit: Unit
    Alive: Alive
    App: App
    Idb: Idb
    Libs: Libs
    Net: Net
    Peer: Peer
    ProjectBrowserAlarms: ProjectBrowserAlarms
    ProjectBrowserContextMenus: ProjectBrowserContextMenus
    ProjectBrowserDeclarativeNetRequest: ProjectBrowserDeclarativeNetRequest
    ProjectBrowserNotifications: ProjectBrowserNotifications
    ProjectBrowserPermissions: ProjectBrowserPermissions
    ProjectBrowserStorageArea: ProjectBrowserStorageArea
    ProjectBrowserStorage: ProjectBrowserStorage
    ProjectBrowser: ProjectBrowser
    ProjectFetcher: ProjectFetcher
    ProjectTarget: ProjectTarget
    Project: Project
    Projects: Projects
    Shell: Shell
    UtilsOrigins: UtilsOrigins
    Utils: Utils
  }

  namespace sw {
    export type Unit = UnitType
    export type Alive = AliveType
    export type App = AppType
    export type Idb = IdbType
    export type Libs = LibsType
    export type Net = NetType
    export type Peer = PeerType
    export type ProjectBrowserAlarms = ProjectBrowserAlarmsType
    export type ProjectBrowserContextMenus = ProjectBrowserContextMenusType
    export type ProjectBrowserDeclarativeNetRequest = ProjectBrowserDeclarativeNetRequestType
    export type ProjectBrowserNotifications = ProjectBrowserNotificationsType
    export type ProjectBrowserPermissions = ProjectBrowserPermissionsType
    export type ProjectBrowserStorageArea = ProjectBrowserStorageAreaType
    export type ProjectBrowserStorage = ProjectBrowserStorageType
    export type ProjectBrowser = ProjectBrowserType
    export type ProjectFetcher = ProjectFetcherType
    export type ProjectTarget = ProjectTargetType
    export type Project = ProjectType
    export type Projects = ProjectsType
    export type Shell = ShellType
    export type UtilsOrigins = UtilsOriginsType
    export type Utils = UtilsType
  }
}
