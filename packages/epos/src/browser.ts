import 'chrome'

export type Browser = {
  // Always available
  action: Action
  extension: Extension
  i18n: I18n
  management: Management
  runtime: Runtime
  windows: Windows

  // Mandatory for epos
  alarms: Alarms
  declarativeNetRequest: DeclarativeNetRequest
  tabs: Tabs
  webNavigation: WebNavigation

  // Optional for epos
  browsingData: BrowsingData
  contextMenus: ContextMenus
  cookies: Cookies
  downloads: Downloads
  notifications: Notifications
  sidePanel: SidePanel
}

export type MakeAsync<T extends (...args: any[]) => any> = (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>
export type Alarms = typeof chrome.alarms
export type Cookies = typeof chrome.cookies
export type WebNavigation = typeof chrome.webNavigation
export type Windows = typeof chrome.windows

export type Action = Omit<
  typeof chrome.action,
  // Not supported by epos:
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

export type Runtime = Omit<
  typeof chrome.runtime,
  // Deprecated
  | 'getBackgroundPage'
  | 'onBrowserUpdateAvailable'

  // Not supported by epos
  | 'connect'
  | 'connectNative' // Requires nativeMessaging" permission
  | 'getPackageDirectoryEntry' // Foreground only, not available in the Service Worker
  | 'lastError'
  | 'onConnect'
  | 'onConnectExternal'
  | 'onConnectNative' // Requires nativeMessaging" permission
  | 'onInstalled'
  | 'OnInstalledReason'
  | 'onMessage'
  | 'onMessageExternal'
  | 'onRestartRequired' // ChromeOS
  | 'OnRestartRequiredReason'
  | 'onStartup'
  | 'onSuspend'
  | 'onSuspendCanceled'
  | 'onUserScriptConnect'
  | 'onUserScriptMessage'
  | 'openOptionsPage'
  | 'restart' // ChromeOS
  | 'restartAfterDelay' // ChromeOS
  | 'sendMessage'
  | 'sendNativeMessage' // Requires nativeMessaging" permission
>

export type DeclarativeNetRequest = Omit<
  typeof chrome.declarativeNetRequest,
  // Not supported by epos
  | 'getAvailableStaticRuleCount'
  | 'getDisabledRuleIds'
  | 'getEnabledRulesets'
  | 'onRuleMatchedDebug' // Requires "declarativeNetRequestFeedback" permission
  | 'setExtensionActionOptions'
  | 'testMatchOutcome'
  | 'updateEnabledRulesets'
  | 'updateStaticRules'
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

export type ContextMenus = Omit<typeof chrome.contextMenus, 'create'> & {
  create: MakeAsync<typeof chrome.contextMenus.create>
}

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

export type SidePanel = Omit<
  typeof chrome.sidePanel,
  // Not supported by epos
  | 'close' // New api, not available in `@types/chrome`
  | 'open'
  | 'setOptions'
  | 'setPanelBehavior'
> & {
  onClosed: chrome.events.Event<() => void> // New api, not available in `@types/chrome`
}
