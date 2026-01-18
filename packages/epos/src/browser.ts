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
  // Not supported by epos (require "management" permission)
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
  | 'connectNative' // Requires "nativeMessaging" permission
  | 'getPackageDirectoryEntry' // Foreground only, not available in the Service Worker
  | 'lastError'
  | 'onConnect'
  | 'onConnectExternal'
  | 'onConnectNative' // Requires "nativeMessaging" permission
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
  | 'sendNativeMessage' // Requires "nativeMessaging" permission
>

export type DeclarativeNetRequest = Omit<
  typeof chrome.declarativeNetRequest,
  | 'updateDynamicRules'
  | 'updateSessionRules'

  // Not supported by epos
  | 'getAvailableStaticRuleCount'
  | 'getDisabledRuleIds'
  | 'getEnabledRulesets'
  | 'getMatchedRules' // Requires "declarativeNetRequestFeedback" permission
  | 'onRuleMatchedDebug' // Requires "declarativeNetRequestFeedback" permission
  | 'setExtensionActionOptions'
  | 'testMatchOutcome'
  | 'updateEnabledRulesets'
  | 'updateStaticRules'
> & {
  /**
   * Modifies the current set of dynamic rules for the extension. The rules with IDs listed in `options.removeRuleIds` are first removed, and then the rules given in `options.addRules` are added. Notes:
   *
   * - In `epos`, `addRules` cannot have IDs, instead IDs will be assigned automatically and returned in the result.
   * - This update happens as a single atomic operation: either all specified rules are added and removed, or an error is returned.
   * - These rules are persisted across browser sessions and across extension updates.
   * - Static rules specified as part of the extension package can not be removed using this function.
   * - {@link MAX_NUMBER_OF_DYNAMIC_RULES} is the maximum number of dynamic rules an extension can add. The number of [unsafe rules](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/#safe_rules) must not exceed {@link MAX_NUMBER_OF_UNSAFE_DYNAMIC_RULES}.
   *
   * Can return its result via Promise in Manifest V3 or later since Chrome 91.
   *
   * @return An array of IDs of the rules that were added.
   */
  updateDynamicRules: (options: UpdateRuleOptions) => Promise<number[]>
  /**
   * Modifies the current set of dynamic rules for the extension. The rules with IDs listed in `options.removeRuleIds` are first removed, and then the rules given in `options.addRules` are added. Notes:
   *
   * Can return its result via Promise in Manifest V3 or later since Chrome 91.
   *
   * - In `epos`, `addRules` cannot have IDs, instead IDs will be assigned automatically and returned in the result.
   * - This update happens as a single atomic operation: either all specified rules are added and removed, or an error is returned.
   * - These rules are persisted across browser sessions and across extension updates.
   * - Static rules specified as part of the extension package can not be removed using this function.
   * - {@link MAX_NUMBER_OF_DYNAMIC_RULES} is the maximum number of dynamic rules an extension can add. The number of [unsafe rules](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/#safe_rules) must not exceed {@link MAX_NUMBER_OF_UNSAFE_DYNAMIC_RULES}.
   *
   * Can return its result via Promise in Manifest V3 or later since Chrome 91.
   *
   * @return An array of IDs of the rules that were added.
   */
  updateSessionRules: (options: UpdateRuleOptions) => Promise<number[]>
}

export type UpdateRuleOptions = {
  /** Rules to add. */
  addRules?: Omit<chrome.declarativeNetRequest.Rule, 'id'>[] | undefined
  /** IDs of the rules to remove. Any invalid IDs will be ignored. */
  removeRuleIds?: number[] | undefined
}

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
  /**
   * Creates a new context menu item.
   * @return The ID of the newly created item.
   */
  create: (createProperties: chrome.contextMenus.CreateProperties) => Promise<string>
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
