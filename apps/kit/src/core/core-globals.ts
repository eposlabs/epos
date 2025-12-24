import { clsx, type ClassValue as ClsxClassValue } from 'clsx'
import * as types from 'dropcap/types'
import 'epos'
import './core-file-system-observer'
import './core-wicg-file-system-access'

declare global {
  type Obj = types.Obj
  type Arr = types.Arr
  type Cls<T = any> = types.Cls<T>
  type Fn<T = any> = types.Fn<T>
  type AsyncFn<T = any> = types.AsyncFn<T>
  type ClassValue = ClsxClassValue
  var cn: typeof clsx
}

cn = clsx
