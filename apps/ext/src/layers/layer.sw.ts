import { Alive, type Alive as AliveType } from '../units/alive.sw.js'
import { App, type App as AppType } from '../units/app.sw.js'
import { Fetcher, type Fetcher as FetcherType } from '../units/fetcher.sw.js'
import { Idb, type Idb as IdbType } from '../units/idb.sw.js'
import { Kit, type Kit as KitType } from '../units/kit.sw.js'
import { Libs, type Libs as LibsType } from '../units/libs.sw.js'
import { Net, type Net as NetType } from '../units/net.sw.js'
import { Peer, type Peer as PeerType } from '../units/peer.sw.js'
import { ProjectBrowserAlarms, type ProjectBrowserAlarms as ProjectBrowserAlarmsType } from '../units/project-browser-alarms.sw.js'
import { ProjectBrowserContextMenus, type ProjectBrowserContextMenus as ProjectBrowserContextMenusType } from '../units/project-browser-context-menus.sw.js'
import { ProjectBrowserDeclarativeNetRequest, type ProjectBrowserDeclarativeNetRequest as ProjectBrowserDeclarativeNetRequestType } from '../units/project-browser-declarative-net-request.sw.js'
import { ProjectBrowserNotifications, type ProjectBrowserNotifications as ProjectBrowserNotificationsType } from '../units/project-browser-notifications.sw.js'
import { ProjectBrowserPermissions, type ProjectBrowserPermissions as ProjectBrowserPermissionsType } from '../units/project-browser-permissions.sw.js'
import { ProjectBrowserStorageArea, type ProjectBrowserStorageArea as ProjectBrowserStorageAreaType } from '../units/project-browser-storage-area.sw.js'
import { ProjectBrowserStorage, type ProjectBrowserStorage as ProjectBrowserStorageType } from '../units/project-browser-storage.sw.js'
import { ProjectBrowser, type ProjectBrowser as ProjectBrowserType } from '../units/project-browser.sw.js'
import { ProjectTarget, type ProjectTarget as ProjectTargetType } from '../units/project-target.sw.js'
import { Project, type Project as ProjectType } from '../units/project.sw.js'
import { Projects, type Projects as ProjectsType } from '../units/projects.sw.js'
import { UtilsOrigins, type UtilsOrigins as UtilsOriginsType } from '../units/utils-origins.sw.js'
import { Utils, type Utils as UtilsType } from '../units/utils.sw.js'

Object.assign(sw, {
  Alive,
  App,
  Fetcher,
  Idb,
  Kit,
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
  ProjectTarget,
  Project,
  Projects,
  UtilsOrigins,
  Utils,
})

declare global {
  const sw: Sw

  interface Sw extends Gl {
    Alive: typeof Alive
    App: typeof App
    Fetcher: typeof Fetcher
    Idb: typeof Idb
    Kit: typeof Kit
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
    ProjectTarget: typeof ProjectTarget
    Project: typeof Project
    Projects: typeof Projects
    UtilsOrigins: typeof UtilsOrigins
    Utils: typeof Utils
  }

  interface sw extends gl {
    Alive: Alive
    App: App
    Fetcher: Fetcher
    Idb: Idb
    Kit: Kit
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
    ProjectTarget: ProjectTarget
    Project: Project
    Projects: Projects
    UtilsOrigins: UtilsOrigins
    Utils: Utils
  }

  namespace sw {
    export type Alive = AliveType
    export type App = AppType
    export type Fetcher = FetcherType
    export type Idb = IdbType
    export type Kit = KitType
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
    export type ProjectTarget = ProjectTargetType
    export type Project = ProjectType
    export type Projects = ProjectsType
    export type UtilsOrigins = UtilsOriginsType
    export type Utils = UtilsType
  }
}
