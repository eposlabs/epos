/// <reference types="epos" />
/// <reference types="vite/client" />
/// <reference types="dropcap/globals" />
/// <reference types="wicg-file-system-access"/>

import './file-system-observer'
import './unit'

declare global {
  const DEV: boolean
  const PROD: boolean
  const ai: any
  const AI: any

  interface Array<T> {
    remove(value: T): boolean
  }
}
