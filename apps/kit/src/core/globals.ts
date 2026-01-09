/// <reference types="rolldown-vite/client" />
import * as types from 'dropcap/types'
import 'epos'
import { Unit } from 'epos-unit'
import './file-system-access'
import './file-system-observer'

declare global {
  type Obj<T = unknown> = types.Obj<T>
  type Arr<T = unknown> = types.Arr<T>
  type Cls<T = unknown> = types.Cls<T>
  type Fn<T = unknown> = types.Fn<T>
  type AsyncFn<T = unknown> = types.AsyncFn<T>

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
