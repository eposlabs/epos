import { Alive, type Alive as AliveType } from '../alive/alive.sw.js'
import { App, type App as AppType } from '../app/app.sw.js'
import { Idb, type Idb as IdbType } from '../idb/idb.sw.js'
import { Libs, type Libs as LibsType } from '../libs/libs.sw.js'
import { Net, type Net as NetType } from '../net/net.sw.js'
import { Peer, type Peer as PeerType } from '../peer/peer.sw.js'
import { ProjectBrowserAlarms, type ProjectBrowserAlarms as ProjectBrowserAlarmsType } from '../projects/project-browser-alarms.sw.js'
import { ProjectBrowserContextMenus, type ProjectBrowserContextMenus as ProjectBrowserContextMenusType } from '../projects/project-browser-context-menus.sw.js'
import { ProjectBrowserDeclarativeNetRequest, type ProjectBrowserDeclarativeNetRequest as ProjectBrowserDeclarativeNetRequestType } from '../projects/project-browser-declarative-net-request.sw.js'
import { ProjectBrowserNotifications, type ProjectBrowserNotifications as ProjectBrowserNotificationsType } from '../projects/project-browser-notifications.sw.js'
import { ProjectBrowserPermissions, type ProjectBrowserPermissions as ProjectBrowserPermissionsType } from '../projects/project-browser-permissions.sw.js'
import { ProjectBrowserStorageArea, type ProjectBrowserStorageArea as ProjectBrowserStorageAreaType } from '../projects/project-browser-storage-area.sw.js'
import { ProjectBrowserStorage, type ProjectBrowserStorage as ProjectBrowserStorageType } from '../projects/project-browser-storage.sw.js'
import { ProjectBrowser, type ProjectBrowser as ProjectBrowserType } from '../projects/project-browser.sw.js'
import { ProjectFetcher, type ProjectFetcher as ProjectFetcherType } from '../projects/project-fetcher.sw.js'
import { ProjectTarget, type ProjectTarget as ProjectTargetType } from '../projects/project-target.sw.js'
import { Project, type Project as ProjectType } from '../projects/project.sw.js'
import { Projects, type Projects as ProjectsType } from '../projects/projects.sw.js'
import { Shell, type Shell as ShellType } from '../shell/shell.sw.js'
import { UtilsOrigins, type UtilsOrigins as UtilsOriginsType } from '../utils/utils-origins.sw.js'
import { Utils, type Utils as UtilsType } from '../utils/utils.sw.js'

Object.assign(sw, {
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
