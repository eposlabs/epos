import type { Browser } from 'epos'

export const _cbId_ = Symbol('id')

export type Callback = Fn & { [_cbId_]?: string }

export type LooseBrowser = {
  // Always available
  action: { [K in keyof Browser['action']]-?: unknown }
  extension: { [K in keyof Browser['extension']]-?: unknown }
  i18n: { [K in keyof Browser['i18n']]-?: unknown }
  management: { [K in keyof Browser['management']]-?: unknown }
  permissions: { [K in keyof Browser['permissions']]-?: unknown }
  runtime: { [K in keyof Browser['runtime']]-?: unknown }
  windows: { [K in keyof Browser['windows']]-?: unknown }

  // Required for epos
  alarms: { [K in keyof Browser['alarms']]-?: unknown }
  declarativeNetRequest?: { [K in keyof Browser['declarativeNetRequest']]-?: unknown }
  tabs: { [K in keyof Browser['tabs']]-?: unknown }
  webNavigation: { [K in keyof Browser['webNavigation']]-?: unknown }

  // Optional for epos
  browsingData: { [K in keyof Browser['browsingData']]-?: unknown }
  contextMenus: { [K in keyof Browser['contextMenus']]-?: unknown }
  cookies: { [K in keyof Browser['cookies']]-?: unknown }
  downloads: { [K in keyof Browser['downloads']]-?: unknown }
  notifications: { [K in keyof Browser['notifications']]-?: unknown }
  sidePanel: { [K in keyof Browser['sidePanel']]-?: unknown }
  storage: {
    local: { [K in keyof Browser['storage']['local']]-?: unknown }
    session: { [K in keyof Browser['storage']['session']]-?: unknown }
    sync: { [K in keyof Browser['storage']['sync']]-?: unknown }
    onChanged: unknown
    AccessLevel: unknown
  }
}

export class ProjectBrowser extends ex.Unit {
  #api: LooseBrowser | null = null
  private $project = this.closest(ex.Project)!
  private bus = this.$.bus.use(`ProjectBrowser[${this.$project.id}]`)
  private listenerIds = new Set<string>()
  static _cbId_ = _cbId_

  get api() {
    if (!this.#api) throw this.never()
    return this.#api as Browser
  }

  async init() {
    await this.setupApi()
  }

  private createMethod(path: string) {
    return this.callMethod.bind(this, path)
  }

  private createEvent(path: string) {
    return {
      addListener: this.addListener.bind(this, path),
      hasListener: this.hasListener.bind(this, path),
      hasListeners: this.hasListeners.bind(this, path),
      removeListener: this.removeListener.bind(this, path),
      dispatch: this.callMethod.bind(this, `${path}.dispatch`),
    }
  }

  private async callMethod(path: string, ...args: unknown[]) {
    return await this.bus.send<sw.ProjectBrowser['callMethod']>('callMethod', path, ...args)
  }

  private addListener(path: string, cb?: Callback) {
    if (!cb) return
    cb[_cbId_] ??= this.$.utils.id()
    const listenerId = this.buildListenerId(path, cb)
    if (this.listenerIds.has(listenerId)) return
    this.listenerIds.add(listenerId)
    this.bus.on(`listenerCallback[${listenerId}]`, cb)
    void this.bus.send('addListener', path, this.$.peer.id, listenerId)
  }

  private hasListener(path: string, cb: Callback) {
    if (!cb || !cb[_cbId_]) return false
    const listenerId = this.buildListenerId(path, cb)
    return this.listenerIds.has(listenerId)
  }

  private hasListeners(path: string) {
    return [...this.listenerIds].some(id => id.startsWith(`${path}[`))
  }

  private removeListener(path: string, cb: Callback) {
    if (!cb || !cb[_cbId_]) return
    const listenerId = this.buildListenerId(path, cb)
    if (!this.listenerIds.has(listenerId)) return
    this.bus.off(`listenerCallback[${listenerId}]`)
    this.listenerIds.delete(listenerId)
    void this.bus.send('removeListener', listenerId)
  }

  private buildListenerId(path: string, cb: Callback) {
    return `${path}[${cb[_cbId_]}]`
  }

  private async setupApi() {
    const tree = await this.bus.send<Obj<any>>('getApiTree')
    if (!tree) throw this.never()

    const manifest = await this.callMethod('runtime.getManifest')
    if (!this.$.utils.is.object(manifest)) throw this.never()

    this.#api = {
      action: {
        // Methods
        disable: this.createMethod('action.disable'),
        enable: this.createMethod('action.enable'),
        getBadgeBackgroundColor: this.createMethod('action.getBadgeBackgroundColor'),
        getBadgeText: this.createMethod('action.getBadgeText'),
        getBadgeTextColor: this.createMethod('action.getBadgeTextColor'),
        getPopup: this.createMethod('action.getPopup'),
        getTitle: this.createMethod('action.getTitle'),
        getUserSettings: this.createMethod('action.getUserSettings'),
        isEnabled: this.createMethod('action.isEnabled'),
        setBadgeBackgroundColor: this.createMethod('action.setBadgeBackgroundColor'),
        setBadgeText: this.createMethod('action.setBadgeText'),
        setBadgeTextColor: this.createMethod('action.setBadgeTextColor'),
        setIcon: this.createMethod('action.setIcon'),
        setPopup: this.createMethod('action.setPopup'),
        setTitle: this.createMethod('action.setTitle'),

        // Events
        onClicked: this.createEvent('action.onClicked'),
        onUserSettingsChanged: this.createEvent('action.onUserSettingsChanged'),
      },

      extension: {
        // Methods
        isAllowedFileSchemeAccess: this.createMethod('extension.isAllowedFileSchemeAccess'),
        isAllowedIncognitoAccess: this.createMethod('extension.isAllowedIncognitoAccess'),
        setUpdateUrlData: this.createMethod('extension.setUpdateUrlData'),

        // Values
        inIncognitoContext: tree.extension.inIncognitoContext,
        ViewType: tree.extension.ViewType,
      },

      i18n: {
        // Methods
        detectLanguage: this.createMethod('i18n.detectLanguage'),
        getAcceptLanguages: this.createMethod('i18n.getAcceptLanguages'),
        getUILanguage: this.createMethod('i18n.getUILanguage'),
      },

      management: {
        // Methods
        getPermissionWarningsByManifest: this.createMethod('management.getPermissionWarningsByManifest'),
        getSelf: this.createMethod('management.getSelf'),
        uninstallSelf: this.createMethod('management.uninstallSelf'),

        // Values
        ExtensionDisabledReason: tree.management.ExtensionDisabledReason,
        ExtensionInstallType: tree.management.ExtensionInstallType,
        ExtensionType: tree.management.ExtensionType,
        LaunchType: tree.management.LaunchType,
      },

      permissions: {
        // Methods
        contains: this.createMethod('permissions.contains'),
        getAll: this.createMethod('permissions.getAll'),
        remove: this.createMethod('permissions.remove'),
        request: this.createMethod('permissions.request'),

        // Events
        onAdded: this.createEvent('permissions.onAdded'),
        onRemoved: this.createEvent('permissions.onRemoved'),
      },

      runtime: {
        // Methods
        getContexts: this.createMethod('runtime.getContexts'),
        getManifest: () => manifest,
        getPlatformInfo: this.createMethod('runtime.getPlatformInfo'),
        getURL: (path: string) => `chrome-extension://${this.api.runtime.id}/${path}`,
        getVersion: () => manifest.version,
        reload: this.createMethod('runtime.reload'),
        requestUpdateCheck: this.createMethod('runtime.requestUpdateCheck'),
        setUninstallURL: this.createMethod('runtime.setUninstallURL'),

        // Events
        onUpdateAvailable: this.createEvent('runtime.onUpdateAvailable'),

        // Values
        ContextType: tree.runtime.ContextType,
        id: tree.runtime.id,
        PlatformArch: tree.runtime.PlatformArch,
        PlatformNaclArch: tree.runtime.PlatformNaclArch,
        PlatformOs: tree.runtime.PlatformOs,
        RequestUpdateCheckStatus: tree.runtime.RequestUpdateCheckStatus,
      },

      windows: {
        // Methods
        create: this.createMethod('windows.create'),
        get: this.createMethod('windows.get'),
        getAll: this.createMethod('windows.getAll'),
        getCurrent: this.createMethod('windows.getCurrent'),
        getLastFocused: this.createMethod('windows.getLastFocused'),
        remove: this.createMethod('windows.remove'),
        update: this.createMethod('windows.update'),

        // Events
        onBoundsChanged: this.createEvent('windows.onBoundsChanged'),
        onCreated: this.createEvent('windows.onCreated'),
        onFocusChanged: this.createEvent('windows.onFocusChanged'),
        onRemoved: this.createEvent('windows.onRemoved'),

        // Values
        CreateType: tree.windows.CreateType,
        WINDOW_ID_CURRENT: tree.windows.WINDOW_ID_CURRENT,
        WINDOW_ID_NONE: tree.windows.WINDOW_ID_NONE,
        WindowState: tree.windows.WindowState,
        WindowType: tree.windows.WindowType,
      },

      alarms: {
        // Methods
        clear: this.createMethod('alarms.clear'),
        clearAll: this.createMethod('alarms.clearAll'),
        create: this.createMethod('alarms.create'),
        get: this.createMethod('alarms.get'),
        getAll: this.createMethod('alarms.getAll'),

        // Events
        onAlarm: this.createEvent('alarms.onAlarm'),
      },

      declarativeNetRequest: {
        // Methods
        getDynamicRules: this.createMethod('declarativeNetRequest.getDynamicRules'),
        getSessionRules: this.createMethod('declarativeNetRequest.getSessionRules'),
        isRegexSupported: this.createMethod('declarativeNetRequest.isRegexSupported'),
        updateDynamicRules: this.createMethod('declarativeNetRequest.updateDynamicRules'),
        updateSessionRules: this.createMethod('declarativeNetRequest.updateSessionRules'),

        // Values
        DomainType: tree.declarativeNetRequest.DomainType,
        HeaderOperation: tree.declarativeNetRequest.HeaderOperation,
        RequestMethod: tree.declarativeNetRequest.RequestMethod,
        ResourceType: tree.declarativeNetRequest.ResourceType,
        RuleActionType: tree.declarativeNetRequest.RuleActionType,
        UnsupportedRegexReason: tree.declarativeNetRequest.UnsupportedRegexReason,
        DYNAMIC_RULESET_ID: tree.declarativeNetRequest.DYNAMIC_RULESET_ID,
        GETMATCHEDRULES_QUOTA_INTERVAL: tree.declarativeNetRequest.GETMATCHEDRULES_QUOTA_INTERVAL,
        GUARANTEED_MINIMUM_STATIC_RULES: tree.declarativeNetRequest.GUARANTEED_MINIMUM_STATIC_RULES,
        MAX_GETMATCHEDRULES_CALLS_PER_INTERVAL: tree.declarativeNetRequest.MAX_GETMATCHEDRULES_CALLS_PER_INTERVAL,
        MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES: tree.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES,
        MAX_NUMBER_OF_DYNAMIC_RULES: tree.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_RULES,
        MAX_NUMBER_OF_ENABLED_STATIC_RULESETS: tree.declarativeNetRequest.MAX_NUMBER_OF_ENABLED_STATIC_RULESETS,
        MAX_NUMBER_OF_REGEX_RULES: tree.declarativeNetRequest.MAX_NUMBER_OF_REGEX_RULES,
        MAX_NUMBER_OF_SESSION_RULES: tree.declarativeNetRequest.MAX_NUMBER_OF_SESSION_RULES,
        MAX_NUMBER_OF_STATIC_RULESETS: tree.declarativeNetRequest.MAX_NUMBER_OF_STATIC_RULESETS,
        MAX_NUMBER_OF_UNSAFE_DYNAMIC_RULES: tree.declarativeNetRequest.MAX_NUMBER_OF_UNSAFE_DYNAMIC_RULES,
        MAX_NUMBER_OF_UNSAFE_SESSION_RULES: tree.declarativeNetRequest.MAX_NUMBER_OF_UNSAFE_SESSION_RULES,
        SESSION_RULESET_ID: tree.declarativeNetRequest.SESSION_RULESET_ID,
      },

      tabs: {
        // Methods
        captureVisibleTab: this.createMethod('tabs.captureVisibleTab'),
        create: this.createMethod('tabs.create'),
        detectLanguage: this.createMethod('tabs.detectLanguage'),
        discard: this.createMethod('tabs.discard'),
        duplicate: this.createMethod('tabs.duplicate'),
        get: this.createMethod('tabs.get'),
        getZoom: this.createMethod('tabs.getZoom'),
        getZoomSettings: this.createMethod('tabs.getZoomSettings'),
        goBack: this.createMethod('tabs.goBack'),
        goForward: this.createMethod('tabs.goForward'),
        group: this.createMethod('tabs.group'),
        highlight: this.createMethod('tabs.highlight'),
        move: this.createMethod('tabs.move'),
        query: this.createMethod('tabs.query'),
        reload: this.createMethod('tabs.reload'),
        remove: this.createMethod('tabs.remove'),
        setZoom: this.createMethod('tabs.setZoom'),
        setZoomSettings: this.createMethod('tabs.setZoomSettings'),
        ungroup: this.createMethod('tabs.ungroup'),
        update: this.createMethod('tabs.update'),

        // Events
        onActivated: this.createEvent('tabs.onActivated'),
        onAttached: this.createEvent('tabs.onAttached'),
        onCreated: this.createEvent('tabs.onCreated'),
        onDetached: this.createEvent('tabs.onDetached'),
        onHighlighted: this.createEvent('tabs.onHighlighted'),
        onMoved: this.createEvent('tabs.onMoved'),
        onRemoved: this.createEvent('tabs.onRemoved'),
        onReplaced: this.createEvent('tabs.onReplaced'),
        onUpdated: this.createEvent('tabs.onUpdated'),
        onZoomChange: this.createEvent('tabs.onZoomChange'),

        // Values
        MutedInfoReason: tree.tabs.MutedInfoReason,
        TabStatus: tree.tabs.TabStatus,
        WindowType: tree.tabs.WindowType,
        ZoomSettingsMode: tree.tabs.ZoomSettingsMode,
        ZoomSettingsScope: tree.tabs.ZoomSettingsScope,
        MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND: tree.tabs.MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND,
        TAB_ID_NONE: tree.tabs.TAB_ID_NONE,
        TAB_INDEX_NONE: tree.tabs.TAB_INDEX_NONE,
      },

      webNavigation: {
        // Methods
        getAllFrames: this.createMethod('webNavigation.getAllFrames'),
        getFrame: this.createMethod('webNavigation.getFrame'),

        // Events
        onBeforeNavigate: this.createEvent('webNavigation.onBeforeNavigate'),
        onCommitted: this.createEvent('webNavigation.onCommitted'),
        onCompleted: this.createEvent('webNavigation.onCompleted'),
        onCreatedNavigationTarget: this.createEvent('webNavigation.onCreatedNavigationTarget'),
        onDOMContentLoaded: this.createEvent('webNavigation.onDOMContentLoaded'),
        onErrorOccurred: this.createEvent('webNavigation.onErrorOccurred'),
        onHistoryStateUpdated: this.createEvent('webNavigation.onHistoryStateUpdated'),
        onReferenceFragmentUpdated: this.createEvent('webNavigation.onReferenceFragmentUpdated'),
        onTabReplaced: this.createEvent('webNavigation.onTabReplaced'),

        // Values
        TransitionQualifier: tree.webNavigation.TransitionQualifier,
        TransitionType: tree.webNavigation.TransitionType,
      },

      browsingData: {
        // Methods
        remove: this.createMethod('browsingData.remove'),
        removeAppcache: this.createMethod('browsingData.removeAppcache'),
        removeCache: this.createMethod('browsingData.removeCache'),
        removeCacheStorage: this.createMethod('browsingData.removeCacheStorage'),
        removeCookies: this.createMethod('browsingData.removeCookies'),
        removeDownloads: this.createMethod('browsingData.removeDownloads'),
        removeFileSystems: this.createMethod('browsingData.removeFileSystems'),
        removeFormData: this.createMethod('browsingData.removeFormData'),
        removeHistory: this.createMethod('browsingData.removeHistory'),
        removeIndexedDB: this.createMethod('browsingData.removeIndexedDB'),
        removeLocalStorage: this.createMethod('browsingData.removeLocalStorage'),
        removeServiceWorkers: this.createMethod('browsingData.removeServiceWorkers'),
        removeWebSQL: this.createMethod('browsingData.removeWebSQL'),
        settings: this.createMethod('browsingData.settings'),
      },

      contextMenus: {
        // Methods
        create: this.createMethod('contextMenus.create'),
        remove: this.createMethod('contextMenus.remove'),
        removeAll: this.createMethod('contextMenus.removeAll'),
        update: this.createMethod('contextMenus.update'),

        // Events
        onClicked: this.createEvent('contextMenus.onClicked'),

        // Values
        ContextType: tree.contextMenus.ContextType,
        ItemType: tree.contextMenus.ItemType,
        ACTION_MENU_TOP_LEVEL_LIMIT: tree.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT,
      },

      cookies: {
        // Methods
        get: this.createMethod('cookies.get'),
        getAll: this.createMethod('cookies.getAll'),
        getAllCookieStores: this.createMethod('cookies.getAllCookieStores'),
        getPartitionKey: this.createMethod('cookies.getPartitionKey'),
        remove: this.createMethod('cookies.remove'),
        set: this.createMethod('cookies.set'),

        // Events
        onChanged: this.createEvent('cookies.onChanged'),

        // Values
        OnChangedCause: tree.cookies.OnChangedCause,
        SameSiteStatus: tree.cookies.SameSiteStatus,
      },

      downloads: {
        // Methods
        acceptDanger: this.createMethod('downloads.acceptDanger'),
        cancel: this.createMethod('downloads.cancel'),
        download: this.createMethod('downloads.download'),
        erase: this.createMethod('downloads.erase'),
        getFileIcon: this.createMethod('downloads.getFileIcon'),
        pause: this.createMethod('downloads.pause'),
        removeFile: this.createMethod('downloads.removeFile'),
        resume: this.createMethod('downloads.resume'),
        search: this.createMethod('downloads.search'),
        show: this.createMethod('downloads.show'),
        showDefaultFolder: this.createMethod('downloads.showDefaultFolder'),

        // Events
        onChanged: this.createEvent('downloads.onChanged'),
        onCreated: this.createEvent('downloads.onCreated'),
        onDeterminingFilename: this.createEvent('downloads.onDeterminingFilename'),
        onErased: this.createEvent('downloads.onErased'),

        // Values
        DangerType: tree.downloads.DangerType,
        FilenameConflictAction: tree.downloads.FilenameConflictAction,
        HttpMethod: tree.downloads.HttpMethod,
        InterruptReason: tree.downloads.InterruptReason,
        State: tree.downloads.State,
      },

      notifications: {
        // Methods
        clear: this.createMethod('notifications.clear'),
        create: this.createMethod('notifications.create'),
        getAll: this.createMethod('notifications.getAll'),
        update: this.createMethod('notifications.update'),

        // Events
        onButtonClicked: this.createEvent('notifications.onButtonClicked'),
        onClicked: this.createEvent('notifications.onClicked'),
        onClosed: this.createEvent('notifications.onClosed'),

        // Values
        PermissionLevel: tree.notifications.PermissionLevel,
        TemplateType: tree.notifications.TemplateType,
      },

      sidePanel: {
        // Methods
        getLayout: this.createMethod('sidePanel.getLayout'),
        getOptions: this.createMethod('sidePanel.getOptions'),
        getPanelBehavior: this.createMethod('sidePanel.getPanelBehavior'),

        // Events
        onClosed: this.createEvent('sidePanel.onClosed'),
        onOpened: this.createEvent('sidePanel.onOpened'),

        // Values
        Side: tree.sidePanel.Side,
      },

      // storage: {
      //   local: {
      //     // Methods
      //     get: this.createMethod('storage.local.get'),
      //     getKeys: this.createMethod('storage.local.getKeys'),
      //     set: this.createMethod('storage.local.set'),
      //     remove: this.createMethod('storage.local.remove'),
      //     clear: this.createMethod('storage.local.clear'),
      //     getBytesInUse: this.createMethod('storage.local.getBytesInUse'),

      //     // Events
      //     onChanged: this.createEvent('storage.local.onChanged'),

      //     // Values
      //     QUOTA_BYTES: tree.storage.local.QUOTA_BYTES,
      //   },

      //   session: {
      //     // Methods
      //     clear: this.createMethod('storage.session.clear'),
      //     get: this.createMethod('storage.session.get'),
      //     getBytesInUse: this.createMethod('storage.session.getBytesInUse'),
      //     getKeys: this.createMethod('storage.session.getKeys'),
      //     remove: this.createMethod('storage.session.remove'),
      //     set: this.createMethod('storage.session.set'),

      //     // Events
      //     onChanged: this.createEvent('storage.session.onChanged'),

      //     // Values
      //     QUOTA_BYTES: tree.storage.session.QUOTA_BYTES,
      //   },

      //   sync: {
      //     // Methods
      //     clear: this.createMethod('storage.sync.clear'),
      //     get: this.createMethod('storage.sync.get'),
      //     getBytesInUse: this.createMethod('storage.sync.getBytesInUse'),
      //     getKeys: this.createMethod('storage.sync.getKeys'),
      //     remove: this.createMethod('storage.sync.remove'),
      //     set: this.createMethod('storage.sync.set'),

      //     // Events
      //     onChanged: this.createEvent('storage.sync.onChanged'),

      //     // Values
      //     QUOTA_BYTES: tree.storage.sync.QUOTA_BYTES,
      //     QUOTA_BYTES_PER_ITEM: tree.storage.sync.QUOTA_BYTES_PER_ITEM,
      //     MAX_ITEMS: tree.storage.sync.MAX_ITEMS,
      //     MAX_WRITE_OPERATIONS_PER_HOUR: tree.storage.sync.MAX_WRITE_OPERATIONS_PER_HOUR,
      //     MAX_WRITE_OPERATIONS_PER_MINUTE: tree.storage.sync.MAX_WRITE_OPERATIONS_PER_MINUTE,
      //   },

      //   onChanged: this.createEvent('storage.onChanged'),
      //   AccessLevel: tree.storage.AccessLevel,
      // },
    }
  }
}
