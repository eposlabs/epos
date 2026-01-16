import 'chrome'

export type Browser = {
  tabs: Tabs
  cookies: Cookies
  downloads: Downloads
}

export type Cookies = typeof chrome.cookies

export type Downloads = Omit<
  typeof chrome.downloads,
  // Deprecated
  | 'setShelfEnabled'

  // Not supported by epos
  | 'open' // Requires user gesture and "downloads.open" permission
  | 'setUiOptions' // Requires "downloads.ui" permission
>

export type Action = Omit<
  typeof chrome.action,
  // Not supported by epos
  'openPopup'
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
