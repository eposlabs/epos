/// <reference types="epos" />
/// <reference types="dropcap" />
/// <reference types="vite/client" />
/// <reference types="wicg-file-system-access" />
import { Unit } from 'epos-unit'
import './file-system-observer'

declare global {
  const DEV: boolean
  const PROD: boolean

  interface Array<T> {
    remove(value: T): boolean
  }
}

class UnitGl<T extends gl = gl> extends Unit<T['App']> {}
gl.Unit = UnitGl

// prettier-ignore
declare global {
  interface Gl { Unit: typeof UnitGl }
  interface gl { Unit: UnitGl }
  namespace gl { export type Unit = UnitGl }
}
