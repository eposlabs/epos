/// <reference types="rolldown-vite/client" />
import * as types from 'dropcap/types'
import 'epos'
import { Unit } from 'epos-unit'
import './file-system-access'
import './file-system-observer'

declare global {
  type Obj = types.Obj
  type Arr = types.Arr
  type Cls<T = any> = types.Cls<T>
  type Fn<T = any> = types.Fn<T>
  type AsyncFn<T = any> = types.AsyncFn<T>
}

class UnitGl<T extends gl = gl> extends Unit<T['App']> {}
gl.Unit = UnitGl

// prettier-ignore
declare global {
  interface Gl { Unit: typeof UnitGl }
  interface gl { Unit: UnitGl }
  namespace gl { export type Unit = UnitGl }
}
