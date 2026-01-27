/// <reference types="chrome"/>
/// <reference types="vite/client" />
/// <reference types="@eposlabs/types"/>
import type { Epos, Spec } from 'epos'

declare global {
  var DEV: boolean
  var PROD: boolean
  var BUNDLE: 'cs' | 'ex' | 'ex-mini' | 'os' | 'pm' | 'sw' | 'vw'
  var require: any
  var $: any // App instance for `cs`, `os`, `sw` and `vw`
  var $epos: any // App instance for `ex`, dev-only
  var install: any
  var remove: any

  interface Window {
    __eposIsTop?: boolean
    __eposTabId?: number
    __eposWindowId?: number
    __eposElement?: Element
    __eposProjectDefs?: ProjectDef[]
    __eposBusPageToken?: string | null
    __eposOriginalGlobals?: Record<string, unknown>
  }

  type Url = string
  type TabInfo = { tabId: number; windowId: number }
  type PartialEpos = Omit<Epos, 'projects'> & { projects?: Epos['projects'] }

  type ProjectDef = {
    id: string
    debug: boolean
    enabled: boolean
    spec: Spec
    manifest: chrome.runtime.ManifestV3
    shadowCss: string
    fn: (epos: PartialEpos) => void
  }

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
