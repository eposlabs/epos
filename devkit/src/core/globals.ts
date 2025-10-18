import './types/file-system-observer'
import './types/wicg-file-system-access'
import clsx, { type ClassValue } from 'clsx'
import type * as types from '@eposlabs/utils/types'
import 'epos'

// gl.cx
gl.cx = clsx
declare global {
  interface Gl {
    cx: typeof clsx
  }
}

// gl.Props
declare global {
  namespace gl {
    export type Props<T extends Obj> = { className?: ClassValue } & T
  }
}

// Useful type shortcuts
declare global {
  type Obj = types.Obj
  type Arr = types.Arr
  type Cls<T = any> = types.Cls<T>
  type Fn<T = any> = types.Fn<T>
  type AsyncFn<T = any> = types.AsyncFn<T>
}
