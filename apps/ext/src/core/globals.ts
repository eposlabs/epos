/// <reference types="chrome"/>
/// <reference types="vite/client" />
/// <reference types="dropcap/globals"/>
import type { Epos, Spec } from 'epos'

declare global {
  // BUNDLER VARS
  // ---------------------------------------------------------------------------
  var DEV: boolean
  var PROD: boolean
  var BUNDLE: 'cs' | 'ex' | 'ex-mini' | 'os' | 'sm' | 'sw' | 'vw'
  var require: any

  // DEV VARS
  // ---------------------------------------------------------------------------

  var $: any // App instance for `cs`, `os`, `sw` and `vw`
  var $epos: any // App instance for `ex`, dev-only
  var install: any
  var remove: any

  // ENGINE VARS
  // ---------------------------------------------------------------------------

  // Global variables injected to pages and frames
  interface Window {
    __eposIsTop?: boolean
    __eposTabId?: number
    __eposWindowId?: number
    __eposElement?: Element
    __eposProjectDefs?: ProjectDef[]
    __eposBusPageToken?: string | null
    __eposOriginalGlobals?: Record<string, unknown>
  }

  // COMMON TYPES
  // ---------------------------------------------------------------------------

  type Url = string
  type TabInfo = { tabId: number; windowId: number }

  type PartialEpos = Omit<Epos, 'projects'> & {
    projects?: Epos['projects']
  }

  type ProjectDef = {
    id: string
    debug: boolean
    enabled: boolean
    spec: Spec
    manifest: chrome.runtime.ManifestV3
    shadowCss: string
    fn: (epos: PartialEpos) => void
  }

  // EXTENDS
  // ---------------------------------------------------------------------------

  interface Node {
    epos?: boolean
  }

  interface RegExpConstructor {
    escape(str: string): string
  }

  interface ErrorConstructor {
    captureStackTrace(targetObject: object, constructorOpt?: Function): void
  }
}
