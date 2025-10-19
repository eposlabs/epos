import './types/file-system-observer'
import './types/wicg-file-system-access'
import { clsx, type ClassValue } from 'clsx'
import type * as types from '@eposlabs/utils/types'
import 'epos'

// cx
cx = clsx
declare global {
  var cx: typeof clsx
}

// Props
declare global {
  type Props<T extends Obj> = { className?: ClassValue } & T
}

// General-purpose types
declare global {
  type Obj = types.Obj
  type Arr = types.Arr
  type Cls<T = any> = types.Cls<T>
  type Fn<T = any> = types.Fn<T>
  type AsyncFn<T = any> = types.AsyncFn<T>
}
