// <all_urls> for files? instead of filter

export const permissionList: chrome.runtime.ManifestPermissions[] = [
  // 'accessibilityFeatures.modify',
  // 'accessibilityFeatures.read',
  // 'activeTab', // ☁️ allowed
  // 'background', // ☁️ allowed
  // 'bookmarks',
  // 'browsingData',
  // 'clipboardRead',
  // 'clipboardWrite',
  // 'contentSettings',
  'contextMenus', // ✅ included
  'cookies', // ✅ included
  // 'declarativeContent',
  // 'declarativeNetRequestFeedback', // ☁️ allowed
  // 'declarativeNetRequestWithHostAccess', // ☁️ allowed
  // 'desktopCapture',
  // 'downloads.open',
  // 'downloads.ui', // ☁️ allowed
  'downloads', // ✅ included
  // 'favicon',
  // 'gcm',
  // 'history',
  // 'identity.email',
  // 'identity',
  // 'idle',
  // 'management',
  // 'nativeMessaging',
  'notifications', // ✅ included
  // 'pageCapture',
  // 'power',
  // 'printerProvider',
  // 'privacy',
  // 'readingList', // ☁️ allowed
  // 'search',
  // 'sessions',
  // 'storage', // ☁️ allowed
  // 'system.cpu',
  // 'system.display',
  // 'system.memory',
  // 'system.storage',
  // 'tabCapture',
  // 'tabGroups',
  // 'topSites',
  // 'webRequest',
]
