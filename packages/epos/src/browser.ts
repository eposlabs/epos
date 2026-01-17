import 'chrome'

export type Browser = {
  // Always available
  action: Action
  extension: Extension
  i18n: I18n
  management: Management
  windows: Windows

  // Mandatory for epos
  alarms: Alarms
  tabs: Tabs
  webNavigation: WebNavigation

  // Optional for epos
  browsingData: BrowsingData
  contextMenus: ContextMenus
  cookies: Cookies
  downloads: Downloads
  notifications: Notifications
}

export type Alarms = typeof chrome.alarms
export type ContextMenus = typeof chrome.contextMenus
export type Cookies = typeof chrome.cookies
export type WebNavigation = typeof chrome.webNavigation
export type Windows = typeof chrome.windows

export type Action = Omit<
  typeof chrome.action,
  // Not supported by epos
  'openPopup'
>

export type Extension = Omit<
  typeof chrome.extension,
  // Deprecated
  | 'getBackgroundPage'
  | 'getExtensionTabs'
  | 'getURL'
  | 'getViews'
  | 'lastError'
  | 'onRequest'
  | 'onRequestExternal'
  | 'sendRequest'
>

export type I18n = Omit<
  typeof chrome.i18n,
  // Not supported by epos
  'getMessage'
>

export type Management = Omit<
  typeof chrome.management,
  // Not supported by epos, requires "management" permission
  | 'createAppShortcut'
  | 'generateAppForLink'
  | 'get'
  | 'getAll'
  | 'getPermissionWarningsById'
  | 'installReplacementWebApp'
  | 'launchApp'
  | 'onDisabled'
  | 'onEnabled'
  | 'onInstalled'
  | 'onUninstalled'
  | 'setEnabled'
  | 'setLaunchType'
  | 'uninstall'
>

export type Tabs = Omit<
  typeof chrome.tabs,
  // Deprecated
  | 'executeScript'
  | 'getAllInWindow'
  | 'getSelected'
  | 'insertCSS'
  | 'onActiveChanged'
  | 'onHighlightChanged'
  | 'onSelectionChanged'
  | 'sendRequest'

  // Not supported by epos
  | 'connect'
  | 'sendMessage'
  | 'getCurrent'
>

export type BrowsingData = Omit<
  typeof chrome.browsingData,
  // Deprecated
  'removePasswords' | 'removePluginData'
>

export type Downloads = Omit<
  typeof chrome.downloads,
  // Deprecated
  | 'setShelfEnabled'

  // Not supported by epos
  | 'open' // Requires user gesture and "downloads.open" permission
  | 'setUiOptions' // Requires "downloads.ui" permission
>

export type Notifications = Omit<
  typeof chrome.notifications,
  // Deprecated
  | 'onShowSettings'

  // Not supported by epos
  | 'getPermissionLevel'
  | 'onPermissionLevelChanged'
>
