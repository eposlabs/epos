/// <reference types="rolldown-vite/client" />
import { clsx, type ClassValue as ClsxClassValue } from 'clsx'
import * as types from 'dropcap/types'
import 'epos'
import { Unit } from 'epos-unit'
import './core-types-file-system-observer'
import './core-types-wicg-file-system-access'

cn = clsx

declare global {
  type Obj = types.Obj
  type Arr = types.Arr
  type Cls<T = any> = types.Cls<T>
  type Fn<T = any> = types.Fn<T>
  type AsyncFn<T = any> = types.AsyncFn<T>
  type ClassValue = ClsxClassValue
  var cn: typeof clsx
}

class UnitGl<T extends gl = gl> extends Unit<T['App']> {}
gl.Unit = UnitGl

// prettier-ignore
declare global {
  interface Gl { Unit: typeof UnitGl }
  interface gl { Unit: UnitGl }
  namespace gl { export type Unit = UnitGl }
}
